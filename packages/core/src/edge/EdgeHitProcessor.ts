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
import { ConsentManager, ConsentValue } from "./consent/ConsentManager";
import { IdentityManager } from "./identity/IdentityManager";
import { EdgeResponseManager } from "./EdgeResponseManager";
import { EdgeHit, EdgeHitType } from "./EdgeHit";
import { EdgeConstants } from "./EdgeConstants";
import { isNullOrEmptyString } from "../core/utils/StringUtil";
import { LocationHintManager } from "./LocationHintManager";
import { Log } from "../core/utils/Log";
import { asyncRequest, HttpConnection, HttpMethod } from "../core/utils/networking";
import { DataObject, DataArray } from "../core/eventhub/EventData";
import { StateStoreManager } from "./StateStoreManager";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeHitProcessor";

const PATH = EdgeConstants.Request.Path;
const URL = EdgeConstants.Request.Url;
const RETRY = EdgeConstants.Request.Retry;
const RECOVERABLE_ERRORS = EdgeConstants.Request.RecoverableStatusCodes;
const DATA = EdgeConstants.Request.Data;
const QUERY = EdgeConstants.Request.Data.Query;
const IMPLEMENTATION_DETAILS = EdgeConstants.Request.ImplementationDetails;

const MAX_QUEUE_SIZE = 100;

export class EdgeHitProcessor {
  private hitQueue: EdgeHitQueue;
  private consentHitQueue: EdgeHitQueue;
  private lastHitTs: number = 0;
  private retryTimeout: number = RETRY.TIMEOUT;
  private isProcessing: boolean = false;

  constructor(
    private edgeResponseManager: EdgeResponseManager,
    private consentManager: ConsentManager,
    private identityManager: IdentityManager,
    private locationHintManager: LocationHintManager //private stateStoreManager: StateStoreManager
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
   * processed and sent to the Edge Network succesfully.
   */
  async process(): Promise<boolean> {
    if (this.isProcessing) {
      return Promise.resolve(false);
    }

    this.isProcessing = true;

    try {
      while (!this.hitQueue.isEmpty() || !this.consentHitQueue.isEmpty()) {
        const consent = await this.consentManager.getCollectConsent();

        const edgeHit = this.hitQueue.peek();
        const consentHit = this.consentHitQueue.peek();

        if (!edgeHit && !consentHit) {
          break;
        }

        let hit: EdgeHit | null = null;

        if (consent === ConsentValue.PENDING) {
          // If consent is NO or PENDING, we will process the consent hit
          if (consentHit) {
            hit = consentHit;
          } else {
            // If there is no consent hit, we will process the edge hit
            break;
          }
        } else if (edgeHit && consentHit) {
          // If both edge and consent hits are present, we will process the hit with the oldest timestamp
          const edgeHitTs = edgeHit?.timestamp ?? 0;
          const consentHitTs = consentHit?.timestamp ?? 0;

          hit = edgeHitTs <= consentHitTs ? edgeHit : consentHit;
        } else {
          // If only one of edge or consent hit is present, we will process that hit
          hit = edgeHit ?? consentHit;
        }

        if (!hit) {
          // This code should never be reached, but adding a null check to force unwrapping hit
          break;
        }

        if (consent === ConsentValue.NO && hit.type !== EdgeHitType.CONSENT) {
          // if the consent is NO and the hit is not a consent hit,
          // remove the hit from the queue and drop it.
          this.popHit(hit);
          continue;
        }

        const identity = await this.identityManager.getIdentityMap();
        const locationHint =
          (await this.locationHintManager.getLocationHint()) as LocationHintValue;
        this.lastHitTs = Date.now();

        const requestBody =
          hit.type === EdgeHitType.EDGE
            ? this.createEdgeRequestBody(hit, identity)
            : this.createConsentRequestBody(hit, identity);

        const url = this.getURLForHit(hit, locationHint);

        const success = await this.sendHit(url, requestBody);
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

    return Promise.resolve(false);
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

  /**
   * Sends the hit to the Edge Network with the given URL and request body.
   * @param url string The URL to send the hit to.
   * @param requestBody string The request body to send.
   * @returns Promise<boolean> boolean indicating if the hit was sent successfully.
   */
  private async sendHit(url: string, requestBody: string): Promise<boolean> {
    return asyncRequest({
      url: url,
      method: HttpMethod.POST,
      body: requestBody,
      timeout: this.retryTimeout,
    })
      .then((response: HttpConnection) => {
        if (response.responseCode === 200) {
          Log.debug(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Hit sent successfully with response code: ${response.responseCode}, body: ${response.bodyAsText}`
          );

          const responseBody = response.bodyAsText ?? "";
          const responseObj = JSON.parse(responseBody);
          this.edgeResponseManager.handleEdgeResponse(responseObj);
        } else {
          Log.error(
            LOG_SOURCE,
            LOG_TAG,
            `process() - Failed to send hit: ${response.responseCode} message: ${response.bodyAsText}`
          );
        }

        return true;
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `process() - Failed to send hit: ${error}`);
        return false;
      });
  }

  /**
   *
   * @param hit EdgeHit to be processed
   * @param identityMap DataObject to be sent in the request body
   * @returns requestBody string
   */
  private createConsentRequestBody(hit: EdgeHit, identityMap: DataObject | null): string {
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
        implementationDetails: this.getImplentationDetails(),
      },
    };

    if (identityMap) {
      (requestObj[DATA.XDM] as DataObject)[DATA.IDENTITY_MAP] = identityMap;
    } else {
      (requestObj[QUERY.KEY] as DataObject)[QUERY.IDENTITY] = this.getECIDQueryPayload()
        .identity as DataObject;
    }

    if (hit.meta) requestObj[DATA.META] = hit.meta;

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
  private createEdgeRequestBody(hit: EdgeHit, identityMap: DataObject | null): string {
    const requestObj: DataObject = {
      xdm: {
        implementationDetails: this.getImplentationDetails(),
      },
      events: [hit.data],
    };

    if (identityMap) {
      (requestObj[DATA.XDM] as DataObject)[DATA.IDENTITY_MAP] = identityMap;
    } else {
      requestObj[QUERY.KEY] = this.getECIDQueryPayload();
    }

    if (hit.meta) requestObj[DATA.META] = hit.meta;

    const requestBody = JSON.stringify(requestObj);

    Log.verbose(LOG_SOURCE, LOG_TAG, `createEdgeRequestBody() - RequestBody: ${requestBody}`);

    return requestBody;
  }

  /**
   * Returns the implementation details object.
   * @returns DataObject
   */
  private getImplentationDetails(): DataObject {
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
  private getURLForHit(hit: EdgeHit, locationHint: LocationHintValue | null = null): string {
    let url = URL.DEFAULT + PATH.PREFIX;
    const query =
      "?configId=" +
      "<YOUR_EDGE_DATASTREAM_ID>" +
      "&requestId=" +
      "407fd2c2-24fc-453e-bf16-613166aa16ce";

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
    return {
      identity: { fetch: [EdgeConstants.IdentityMap.NameSpace.ECID] },
    };
  }
}

/**
 * The allowed values for the location hint.
 */
export enum LocationHintValue {
  // TODO add all the allowed values
  OR = "or",
  IND = "ind",
}
