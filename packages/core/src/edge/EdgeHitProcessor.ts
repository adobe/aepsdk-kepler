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
import { EdgeStateManager } from "./EdgeStateManager";
import { safeStringify } from "../core/utils/common";
import { createConsentRequestBody } from "./network-handling/RequestHelper";
import { createEdgeRequestBody } from "./network-handling/RequestHelper";
import { getURLForHit } from "./network-handling/UrlHelper";
import { isEmptyDataObject } from "../core/utils/DataObjectUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeHitProcessor";

const REQUEST = EdgeConstants.Request;
const RETRY = EdgeConstants.Request.Retry;
const META = EdgeConstants.Request.Data.Meta;
const RECOVERABLE_ERRORS = EdgeConstants.Request.RecoverableStatusCodes;

const MAX_QUEUE_SIZE = 100;
const INVALID_TIMESTAMP = -1;
const STATUS_CODE = EdgeConstants.Request.StatusCode;

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
        const datastreamId = this.edgeStateManager.getDatastreamId() ?? "";
        const domain = this.edgeStateManager.getEdgeDomain() ?? "";

        if (isNullOrEmptyString(datastreamId)) {
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

        const identity = this.edgeStateManager.getIdentityMap();
        const locationHint = this.edgeResponseManager.getLocationHint();
        const stateStore = this.edgeResponseManager.getStateStore() ?? [];
        const meta = this.createMetaPayload(hit, datastreamId, stateStore);

        const requestBody =
          hit.type === EdgeHitType.EDGE
            ? createEdgeRequestBody(hit, identity, meta)
            : createConsentRequestBody(hit, identity, meta);

        const url = getURLForHit(datastreamId, hit, domain, locationHint);

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
   * Create the meta payload for the hit.
   * @param hit EdgeHit The hit to create the meta payload for.
   * @param datastreamId string The datastream id.
   * @param stateStore DataArray The state store.
   * @returns DataObject The meta payload.
   */
  createMetaPayload(hit: EdgeHit, datastreamId: string, stateStore: DataArray): DataObject {
    const meta = hit.meta ?? {};

    // Add state entries if present
    if (stateStore.length > 0) {
      meta[META.STATE] = {
        [META.ENTRIES]: stateStore,
      };
    }

    // Append datastream config override if present
    if (hit.datastreamConfigOverride) {
      meta[META.CONFIG_OVERRIDES] = hit.datastreamConfigOverride;
    }

    // Append datastream id override if present
    if (hit.datastreamIdOverride) {
      meta[META.SDK_CONFIG] = {
        [META.DATASTREAM]: {
          [META.ORIGINAL]: datastreamId,
        },
      };
    }

    return meta;
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
        const responseCode = response.responseCode;

        if (
          responseCode === STATUS_CODE.SUCCESS ||
          responseCode === STATUS_CODE.MULTI_STATUS ||
          responseCode === STATUS_CODE.NO_CONTENT
        ) {
          this.handleSuccessResponse(response, requestId);
          return true;
        } else if (this.isRecoverableError(responseCode)) {
          this.handleRecoverableError(response, requestId);
          return false;
        } else {
          this.handleUnrecoverableError(response, requestId);
          return true; // Do not retry
        }
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `process() - Failed to send hit with error: \n (${error})`);
        return false;
      });
  }

  private handleSuccessResponse(response: HttpConnection, requestId: string) {
    const responseCode = response.responseCode;
    let msgPrefix = "";
    let responseObj = {};
    try {
      switch (responseCode) {
        case STATUS_CODE.MULTI_STATUS:
          msgPrefix = "Hit was sent successfully, but encountered non-fatal errors/warnings";
          responseObj = JSON.parse(response.bodyAsText ?? "{}");
          break;
        case STATUS_CODE.NO_CONTENT:
          msgPrefix = "Hit was sent successfully, but no content returned";
          break;
        default:
          msgPrefix = "Hit was sent successfully";
          responseObj = JSON.parse(response.bodyAsText ?? "{}");
          break;
      }
    } catch (error) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `handleSuccessResponse() - Failed to parse response body. Error: ${error}`
      );
    }

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `handleSuccessResponse() - ${msgPrefix} \n response code:(${responseCode}), \n body: ${safeStringify(
        response.bodyAsText ?? "",
        undefined,
        2
      )}`
    );

    // Reset the last failed hit timestamp
    this.lastFailedHitTs = INVALID_TIMESTAMP;

    if (isEmptyDataObject(responseObj)) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        `handleSuccessResponse() - Empty response body. No response object to handle.`
      );
      return;
    }

    this.edgeResponseManager.handleEdgeResponse(responseObj, requestId);
  }

  private handleRecoverableError(response: HttpConnection, requestId: string) {
    Log.error(
      LOG_SOURCE,
      LOG_TAG,
      `handleRecoverableError() - Request with id:(${requestId}) failed with recoverable response code: (${response.responseCode}) \n message: ${response.bodyAsText}. Request will be retried in ${this.retryTimeout}ms.`
    );
    // Set the last failed hit timestamp
    this.lastFailedHitTs = Date.now();
  }

  private handleUnrecoverableError(response: HttpConnection, requestId: string) {
    Log.error(
      LOG_SOURCE,
      LOG_TAG,
      `handleUnrecoverableError() - Request failed with unrecoverable error response code: ${response.responseCode} \n message: ${response.bodyAsText}. Request will not be retried.`
    );

    // Reset the last failed hit timestamp
    this.lastFailedHitTs = INVALID_TIMESTAMP;

    this.edgeResponseManager.handleEdgeErrorResponse(requestId);
  }

  /**
   * Checks if the error code is recoverable.
   * @param code number The error code to check.
   * @returns boolean indicating if the error is recoverable.
   */
  private isRecoverableError(errorCode: number): boolean {
    return RECOVERABLE_ERRORS.includes(errorCode as 408 | 500 | 503);
  }
}
