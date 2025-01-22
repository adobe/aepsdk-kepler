/*
Copyright 2024 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { EdgeHitQueue } from "./EdgeHitQueue";
import { ConsentValue } from "./consent/ConsentManager";
import { EdgeResponseManager } from "./EdgeResponseManager";
import { EdgeHit, EdgeHitType } from "./EdgeHit";
import { EdgeConstants } from "./EdgeConstants";
import { isNullOrEmptyString } from "../core/utils/StringUtil";
import { Log } from "../core/utils/Log";
import { asyncRequest, HttpConnection, HttpMethod } from "../core/utils/networking";
import { DataObject, DataArray } from "../core/eventhub/EventData";
import { getAsDataArray, getAsDataObject, isNullOrEmptyObject } from "../core/utils/DataTypeUtil";
import { EdgeStateManager } from "./EdgeStateManager";
import { getDataObject } from "../core/utils/DataObjectUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeHitProcessor";

const REQUEST = EdgeConstants.Request;
const PATH = EdgeConstants.Request.Path;
const URL = EdgeConstants.Request.Url;
const RETRY = EdgeConstants.Request.Retry;
const DATA = EdgeConstants.Request.Data;
const QUERY = EdgeConstants.Request.Data.Query;
const META = EdgeConstants.Request.Data.Meta;
const IMPLEMENTATION_DETAILS = EdgeConstants.Request.ImplementationDetails;
const RECOVERABLE_ERRORS = EdgeConstants.Request.RecoverableStatusCodes;
const SUCCESS_RESPONSE_CODE = 200;

const MAX_QUEUE_SIZE = 100;
const INVALID_TIMESTAMP = -1;

export class EdgeHitProcessor {
  private hitQueue: EdgeHitQueue;
  private consentHitQueue: EdgeHitQueue;
  private retryTimeout: number = RETRY.TIMEOUT;
  private isProcessing: boolean = false;
  private lastFailedHitTs: number = INVALID_TIMESTAMP;

  constructor(
    private edgeResponseManager: EdgeResponseManager,
    private edgeStateManager: EdgeStateManager
  ) {
    this.hitQueue = new EdgeHitQueue();
    this.consentHitQueue = new EdgeHitQueue();
  }

  /**
   * Adds a hit to the queue to be sent to the Edge Network.
   * @param hit EdgeHit
   */
  queueHit(hit: EdgeHit): void {
    this.checkHitQueueSize(hit);

    if (hit.type === EdgeHitType.CONSENT) {
      this.consentHitQueue.push(hit);
    } else {
      this.hitQueue.push(hit);
    }
  }

  /**
   * Checks if the queue for edge and consent hits has reached max size
   * Drops the oldest hit if the queue size is
   * greater than or equal to the max size.
   *
   * @param hit EdgeHit the incoming hit
   */
  private checkHitQueueSize(hit: EdgeHit): void {
    if (hit.type === EdgeHitType.EDGE && this.hitQueue.size() >= MAX_QUEUE_SIZE) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        "checkHitQueueSize() - Edge hit queue has reached max size. Dropping the oldest hit."
      );
      this.hitQueue.popFront();
    }

    if (hit.type === EdgeHitType.CONSENT && this.consentHitQueue.size() >= MAX_QUEUE_SIZE) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        "checkHitQueueSize() - Consent hit queue has reached max size. Dropping the oldest hit."
      );
      this.consentHitQueue.popFront();
    }
  }

  /**
   * Processes the hits in the queue and sends them to the Edge Network.
   * The hits are processed in the order they were added to the queue unless
   * the consent is PENDING. In that case, the consent hit is processed first.
   * If the consent is NO, the edge hits are dropped but the
   * consent hits are processed and sent to the Edge Network.
   * @returns Promise<boolean> boolean indicating if the hits were
   * processed and sent to the Edge Network successfully.
   */
  async process(): Promise<boolean> {
    if (this.isProcessing) {
      return Promise.resolve(false);
    }

    this.isProcessing = true;

    try {
      while (!this.hitQueue.isEmpty() || !this.consentHitQueue.isEmpty()) {
        if (isNullOrEmptyString(this.edgeStateManager.getDatastreamId())) {
          Log.error(
            LOG_SOURCE,
            LOG_TAG,
            "process() - Datastream ID (edge.configId) is not set in configuration. Cannot process the hits."
          );
          return Promise.resolve(false);
        }

        if (this.shouldWaitBeforeRetry()) {
          Log.verbose(LOG_SOURCE, LOG_TAG, "process() - Waiting before retrying the failed hit.");
          return Promise.resolve(false);
        }

        const consent = this.edgeStateManager.getCollectConsent();
        const hit = this.getNextHit(consent);

        if (!hit) {
          // This condition can be reached if the collect consent is pending and there are no consent hits
          return Promise.resolve(false);
        }

        const requestId = hit.requestId;

        if (consent === ConsentValue.NO && hit.type !== EdgeHitType.CONSENT) {
          // if the consent is NO and the hit is not a consent hit,
          // remove the hit from the queue and drop it.
          Log.debug(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Dropping edge hit with id:(${requestId}) as collect consent is set to NO.`
          );
          this.popHit(hit);
          continue;
        }

        let meta = hit.meta;
        const identity = this.edgeStateManager.getIdentityMap();
        const locationHint = this.edgeResponseManager.getLocationHint();
        const stateStore = this.edgeResponseManager.getStateStore();

        meta = this.appendStateToMeta(meta, stateStore);

        if (hit.datastreamIdOverride) {
          // append the original datastream id to the meta object
          meta[META.SDK_CONFIG] = {
            datastream: {
              original: this.edgeStateManager.getDatastreamId(),
            },
          };
        }

        const requestBody =
          hit.type === EdgeHitType.EDGE
            ? this.createEdgeRequestBody(hit, identity, meta)
            : this.createConsentRequestBody(hit, identity, meta);

        const url = this.getURLForHit(hit, locationHint);

        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `process() - Sending hit with id:(${requestId}) to URL: ${url}`
        );

        const success = await this.sendHit(requestId, url, requestBody);
        if (success) {
          this.popHit(hit);
        } else {
          return Promise.resolve(false);
        }
      }
      return Promise.resolve(true);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Returns the next hit to be processed based on the collect consent value.
   * If the collect consent is PENDING, the consent hit is returned.
   * If the collect consent is YES or NO, oldest hit is returned.
   * @param collectConsent ConsentValue The collect consent value.
   * @returns EdgeHit The next hit to be processed or null if there are no hits to be processed.
   */
  private getNextHit(collectConsent: ConsentValue | null): EdgeHit | null {
    const consentHit = this.consentHitQueue.peek();
    const edgeHit = this.hitQueue.peek();

    if (!edgeHit && !consentHit) {
      return null;
    }

    if (collectConsent === ConsentValue.PENDING) {
      return consentHit;
    }

    if (edgeHit && consentHit) {
      return edgeHit.timestamp < consentHit.timestamp ? edgeHit : consentHit;
    }

    return edgeHit ?? consentHit;
  }

  /**
   * Appends the state store to the meta object.
   * @param meta DataObject The meta object to append the state store to.
   * @param stateStore DataArray The state store to append to the meta object.
   * @returns DataObject The updated meta object.
   */
  private appendStateToMeta(meta: DataObject | null, stateStore: DataArray | null): DataObject {
    const updatedMeta = getAsDataObject(meta) ?? {};
    const stateMetadata: DataObject = {};
    const stateStoreArr = getAsDataArray(stateStore) ?? [];

    if (stateStoreArr.length > 0) {
      stateMetadata[META.ENTRIES] = stateStore;
    }

    if (!isNullOrEmptyObject(stateMetadata)) {
      updatedMeta[META.STATE] = stateMetadata;
    }

    return updatedMeta;
  }

  /**
   * Removes the hit from the queues based on the hit type.
   * @param hit EdgeHit
   */
  private popHit(hit: EdgeHit): EdgeHit | null {
    if (hit.type === EdgeHitType.CONSENT) {
      return this.consentHitQueue.popFront();
    } else {
      return this.hitQueue.popFront();
    }
  }

  /**
   * Returns the number of hits in the edge queue.
   * @returns number The number of hits in the queue.
   */
  getEdgeQueueSize(): number {
    return this.hitQueue.size();
  }

  /**
   * Returns the number of hits in the consent queue.
   * @returns number The number of hits in the queue.
   */
  getConsentQueueSize(): number {
    return this.consentHitQueue.size();
  }

  isQueueEmpty(): boolean {
    return this.hitQueue.isEmpty() && this.consentHitQueue.isEmpty();
  }

  /**
   * Checks if the request is ready to be retried in case of a retry.
   * Returns true if it is not a retry or if the retry timeout has elapsed.
   * @returns boolean indicating if the wait timeout has elapsed.
   */
  private shouldWaitBeforeRetry(): boolean {
    if (this.lastFailedHitTs !== INVALID_TIMESTAMP) {
      const timeSinceLastFailedHit = Date.now() - this.lastFailedHitTs;

      if (timeSinceLastFailedHit < this.retryTimeout) {
        const diff = this.retryTimeout - timeSinceLastFailedHit;
        Log.debug(
          LOG_SOURCE,
          LOG_TAG,
          `isWaitingForRetry() - Waiting for (${diff}) ms more before retrying the failed hit.`
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Sends the hit to the Edge Network with the given URL and request body.
   * @param url string The URL to send the hit to.
   * @param requestBody string The request body to send.
   * @returns Promise<boolean> boolean indicating if the hit was sent successfully.
   */
  private async sendHit(requestId: string, url: string, requestBody: string): Promise<boolean> {
    return asyncRequest({
      url: url,
      method: HttpMethod.POST,
      body: requestBody,
      timeout: REQUEST.TIMEOUT,
    })
      .then((response: HttpConnection) => {
        if (response.responseCode === SUCCESS_RESPONSE_CODE) {
          Log.debug(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Hit sent successfully with response \n code: ${
              response.responseCode
            }, \n body: ${JSON.stringify(JSON.parse(response.bodyAsText ?? ""), undefined, 2)}`
          );

          // Reset the last failed hit timestamp
          this.lastFailedHitTs = INVALID_TIMESTAMP;

          const responseBody = response.bodyAsText ?? "";
          const responseObj = JSON.parse(responseBody);
          this.edgeResponseManager.handleEdgeResponse(responseObj, requestId);

          return true;
        } else if (this.isRecoverableError(response.responseCode)) {
          // Set the last failed hit timestamp
          this.lastFailedHitTs = Date.now();

          Log.error(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Request failed with recoverable response code: (${response.responseCode}) \n message: ${response.bodyAsText}. Request will be retried in ${this.retryTimeout}ms.`
          );

          return false;
        } else {
          // Reset the last failed hit timestamp
          this.lastFailedHitTs = INVALID_TIMESTAMP;

          Log.error(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Request failed with unrecoverable error response code: ${response.responseCode} \n message: ${response.bodyAsText}. Request will not be retried.`
          );
          return true; // Do not retry
        }
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `process() - Failed to send hit with error: \n (${error})`);
        return false;
      });
  }

  /**
   * Checks if the error code is recoverable.
   * @param code number The error code to check.
   * @returns boolean indicating if the error is recoverable.
   */
  private isRecoverableError(errorCode: number): boolean {
    return RECOVERABLE_ERRORS.includes(errorCode as 408 | 500 | 503);
  }

  /**
   *
   * @param hit EdgeHit to be processed
   * @param identityMap DataObject to be sent in the request body
   * @returns requestBody string
   */
  private createConsentRequestBody(
    hit: EdgeHit,
    identityMap: DataObject | null,
    meta: DataObject | null
  ): string {
    // TODO: Add timestamp to the hitE
    const consentData = (hit.data?.consent as DataArray) ?? [];

    const requestObj: DataObject = {
      consent: consentData,
      query: {
        [QUERY.CONSENT]: {
          operation: QUERY.UPDATE,
        },
      },
      xdm: {
        implementationDetails: this.getImplementationDetails(),
      },
    };

    if (identityMap) {
      const xdmData = getDataObject(requestObj, DATA.XDM) ?? {};
      xdmData[DATA.IDENTITY_MAP] = identityMap;
      requestObj[DATA.XDM] = xdmData;
    } else {
      const queryData = getDataObject(requestObj, QUERY.KEY) ?? {};
      queryData[QUERY.IDENTITY] = this.getECIDQueryPayload();
      requestObj[QUERY.KEY] = queryData;
    }

    if (!isNullOrEmptyObject(meta)) requestObj[META.KEY] = meta;

    const requestBody = JSON.stringify(requestObj);

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      "createConsentRequestBody() - RequestBody: " + JSON.stringify(requestBody)
    );

    return requestBody;
  }

  /**
   *
   * @param hit EdgeHit to be processed
   * @param identityMap DataObject to be sent in the request body
   * @returns requestBody string
   */
  private createEdgeRequestBody(
    hit: EdgeHit,
    identityMap: DataObject | null,
    meta: DataObject | null
  ): string {
    const requestObj: DataObject = {
      xdm: {
        implementationDetails: this.getImplementationDetails(),
      },
      events: [],
    };

    // TODO Add xdm and data individually to the request object
    requestObj.events = [hit.data ?? {}];

    if (identityMap) {
      const xdmData = getDataObject(requestObj, DATA.XDM) ?? {};
      xdmData[DATA.IDENTITY_MAP] = identityMap;
      requestObj[DATA.XDM] = xdmData;
    } else {
      const queryData = getDataObject(requestObj, QUERY.KEY) ?? {};
      queryData[QUERY.IDENTITY] = this.getECIDQueryPayload();
      requestObj[QUERY.KEY] = queryData;
    }

    if (!isNullOrEmptyObject(meta)) requestObj[META.KEY] = meta;

    const requestBody = JSON.stringify(requestObj);

    Log.verbose(LOG_SOURCE, LOG_TAG, `createEdgeRequestBody() - RequestBody: ${requestBody}`);

    return requestBody;
  }

  /**
   * Returns the implementation details object.
   * @returns DataObject
   */
  private getImplementationDetails(): DataObject {
    return {
      name: IMPLEMENTATION_DETAILS.NAME,
      version: EdgeConstants.EXTENSION_VERSION, //Edge and core will be of same version always
      environment: IMPLEMENTATION_DETAILS.ENVIRONMENT,
    };
  }

  /**
   * Returns the URL for the hit based on the hit type.
   * @param hit EdgeHit
   * @param locationHint LocationHintValue
   * @returns string The URL for the hit.
   */
  private getURLForHit(hit: EdgeHit, locationHint: string | null = null): string {
    const customDomain = this.edgeStateManager.getEdgeDomain();
    const domain = isNullOrEmptyString(customDomain) ? URL.DEFAULT : customDomain;

    let url = domain + PATH.PREFIX;
    const requestId = hit.requestId;

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getURLForHit() - configID: ${this.edgeStateManager.getDatastreamId()}`
    );

    let query = `?configId=${this.edgeStateManager.getDatastreamId()}&requestId=${requestId}`;

    if (hit.datastreamIdOverride) {
      query = `?configId=${hit.datastreamIdOverride}&requestId=${requestId}`;
    }

    url += isNullOrEmptyString(locationHint) ? "" : `/${locationHint}`;

    const overridePath = hit.path;

    if (hit.type === EdgeHitType.CONSENT) {
      url += isNullOrEmptyString(overridePath) ? PATH.CONSENT : overridePath;
    } else {
      url += isNullOrEmptyString(overridePath) ? PATH.INTERACT : overridePath;
    }

    url += query;

    return url;
  }

  /**
   * Returns the query payload for fetching ECID.
   * @returns DataObject The query payload for fetching ECID.
   */
  private getECIDQueryPayload(): DataObject {
    return { fetch: [EdgeConstants.IdentityMap.NameSpace.ECID] };
  }
}

/**
 * The allowed values for the location hint.
 */
export enum LocationHintValue {
  /// Oregon, USA
  or2 = "or2",
  /// Virginia, USA
  va6 = "va6",
  /// Ireland
  irl1 = "irl1",
  /// India
  ind1 = "ind1",
  /// Japan
  jpn3 = "jpn3",
  /// Singapore
  sgp3 = "sgp3",
  /// Australia
  aus3 = "aus3",
}
