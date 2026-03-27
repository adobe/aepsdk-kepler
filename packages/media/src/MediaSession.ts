/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Log } from "@adobe/vega-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";
import { MediaHit } from "./MediaHit";
import { DataObject } from "@adobe/vega-aepcore/dist/core/eventhub/EventData";
import { DispatchFn } from "./MediaExtension";
import { Queue } from "@adobe/vega-aepcore/dist/core/utils/Queue";
import { Event, EventType, EventSource, EventData } from "@adobe/vega-aepcore/dist/core/eventhub";
import {
  isNullOrEmptyString,
  caseInsensitiveEquals,
} from "@adobe/vega-aepcore/dist/core/utils/StringUtil";
import {
  getDataObject,
  getNumber,
  getString,
} from "@adobe/vega-aepcore/dist/core/utils/DataObjectUtil";
import { safeStringify } from "@adobe/vega-aepcore/dist/core/utils/common";

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaSession";

const EVENT_TYPE = MediaConstants.EventType;
const MEDIA_PATH_PREFIX: string = "/va/v1";
const MAX_PING_INTERVAL_SEC: number = 50; // 50 seconds

const ERROR = MediaConstants.Edge.Error;
const EVENT_DATA_KEYS = MediaConstants.EventDataKeys;

export class MediaSession {
  private _isActive: boolean = true;

  private backendSessionId: string | null = null;
  private hitQueue: Queue<MediaHit> = new Queue<MediaHit>();

  private _sessionStartRequestId: string | null = null;
  private _lastEventTimestamp: number = -1;

  private hasLoggedBackendSessionWait = false;

  constructor(
    private _playerId: string,
    private dispatchFn: DispatchFn,
    private configuration: DataObject = {}
  ) {}

  /**
   * Checks whether the media session is active.
   * @returns True if the media session is active, false otherwise.
   */
  public isActive(): boolean {
    return this._isActive;
  }

  /**
   * Returns the player ID.
   * @returns The player ID.
   */
  public getPlayerId(): string {
    return this._playerId;
  }

  /**
   * Processes a media hit.
   * @param hit The media hit to be processed.
   */
  public process(hit: MediaHit) {
    if (!this.isActive()) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `Media session with playerId:(${this.getPlayerId()}) is not active. Cannot process hits.`
      );
      return;
    }

    this.hitQueue.enqueue(hit);
    this.tryDispatchMediaEvents();
  }

  /**
   * Ends the media session.
   * This method should be called when the media session is complete.
   * It will dispatch any remaining media events in the hit queue.
   * Once the session is ended, no more media events can be dispatched.
   */
  public end() {
    if (!this.isActive()) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `end() - Cannot end media session with playerId:(${this.getPlayerId()}), as it is not active.`
      );
      return;
    }

    this._isActive = false;
    this.tryDispatchMediaEvents();

    if (this.hitQueue.isEmpty()) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        `Media session with playerId:(${this.getPlayerId()}) has ended successfully.`
      );
    } else {
      Log.warning(
        LOG_SOURCE,
        LOG_TAG,
        `Media session with playerId:(${this.getPlayerId()}) has ended, but all the queued media events could not be dispatched.`
      );
    }
  }

  /**
   * Aborts the media session.
   * This method should be called when the media session is to be aborted.
   * It will clear the hit queue and end the session.
   * Once the session is aborted, no more media events can be dispatched.
   */
  public abort() {
    if (!this.isActive()) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `abort() - Cannot abort media session with playerId:(${this.getPlayerId()}), as it is not active.`
      );
      return;
    }

    this._isActive = false;
    this.hitQueue.clear();
  }

  /**
   * Handles the response from the edge for the session start request.
   * @param requestId The request ID of the session start request.
   * @param backendSessionId The backend session ID.
   */
  public handleSessionUpdate(requestId: string, backendSessionId: string) {
    if (this.getSessionStartRequestId() !== requestId) {
      return;
    }

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `Received backend session ID: ${backendSessionId} for playerId:(${this.getPlayerId()})`
    );
    this.backendSessionId = backendSessionId;

    // trigger dispatch of queued media events
    this.tryDispatchMediaEvents();
  }

  /**
   * Handles an error response from the edge for the session start request.
   * @param requestId The request ID of the session start request.
   * @param data The error response data
   */
  public handleErrorResponse(requestId: string, data: DataObject) {
    if (this.getSessionStartRequestId() !== requestId) {
      return;
    }

    Log.error(
      LOG_SOURCE,
      LOG_TAG,
      `handleErrorResponse() - Error response received for session start request: ${JSON.stringify(
        data
      )}`
    );

    const statusCode = getNumber(data, ERROR.STATUS) ?? -1;
    const errorType = getString(data, ERROR.TYPE) ?? "";

    // case insensitive comparison for errorType
    if (statusCode === ERROR.CODE_400 && caseInsensitiveEquals(errorType, ERROR.TYPE_VA_EDGE_400)) {
      Log.warning(
        LOG_SOURCE,
        LOG_TAG,
        `handleErrorResponse() - [Session with playerId:(${this.getPlayerId()})] - Aborting session as error occurred while creating the session. Error: ${safeStringify(
          data
        )}`
      );

      this.abort();
    }
  }

  /**
   * For testing purposes only.
   * Returns the session start request ID.
   * @returns The session start request ID.
   */
  public getSessionStartRequestId(): string | null {
    return this._sessionStartRequestId;
  }

  /**
   * For testing purposes only.
   * Returns the last event timestamp.
   * @returns The last dispatched event timestamp.
   */
  public getLastEventTimestamp(): number {
    return this._lastEventTimestamp;
  }

  /**
   * For testing purposes only.
   * Returns the backend session ID.
   * @returns The backend session ID.
   */
  public getBackendSessionId(): string | null {
    return this.backendSessionId;
  }

  /**
   * For testing purposes only.
   * Returns the hit queue.
   * @returns The hit queue.
   */
  public getHitQueue() {
    return this.hitQueue;
  }

  /**
   * Checks if there are any media events in the hit queue
   * and tries to dispatch them.
   * Events other than media.sessionStart will
   * need to wait for backendSessionId before being dispatched.
   */
  private tryDispatchMediaEvents() {
    while (!this.hitQueue.isEmpty()) {
      const hit = this.hitQueue.peek();

      if (!hit) {
        Log.error(
          LOG_SOURCE,
          LOG_TAG,
          "tryDispatchMediaEvents() - Cannot dispatch media event, hit is null."
        );
        return;
      }

      if (
        hit.eventType !== EVENT_TYPE.SESSION_START &&
        isNullOrEmptyString(this.getBackendSessionId())
      ) {
        if (!this.hasLoggedBackendSessionWait) {
          Log.debug(
            LOG_SOURCE,
            LOG_TAG,
            `tryDispatchMediaEvents() - Waiting for backend session ID for event: ${hit.eventType}`
          );
          this.hasLoggedBackendSessionWait = true;
        }

        return;
      }

      this.hasLoggedBackendSessionWait = false;
      this.dispatchMediaEvent(hit);
    }
  }

  /**
   * Dispatches a media event to the event hub.
   * Edge extension will listen to this event and send the hit to the edge.
   * @param hit The media hit to be dispatched.
   */
  private dispatchMediaEvent(hit: MediaHit) {
    this.checkPingInterval(hit.timestamp);

    const requestObject = this.getRequestObjectWithCustomPath(hit);
    const data = hit.data ?? {};
    data[EVENT_DATA_KEYS.REQUEST] = requestObject;

    if (hit.eventType !== EVENT_TYPE.SESSION_START) {
      this.appendSessionIdToData(data);
    }

    const eventData = EventData.buildFrom(data);

    const event = Event.builder(
      hit.eventType,
      EventType.EDGE,
      EventSource.REQUEST_CONTENT,
      eventData
    )
      .setParentId(hit.parentId)
      .build();

    if (this.dispatchFn) {
      this.dispatchFn(event);
    } else {
      Log.error(LOG_SOURCE, LOG_TAG, "dispatchFn is null. Cannot dispatch event.");
    }

    this.hitQueue.dequeue();
    this._lastEventTimestamp = event.timestamp;

    if (hit.eventType === EVENT_TYPE.SESSION_START) {
      this._sessionStartRequestId = event.uuid;
    }
  }

  /**
   * Appends the backend session ID to the data.xdm.mediaCollection object.
   * @param data The data object.
   * @returns The data object with the backend session ID appended.
   */
  private appendSessionIdToData(data: DataObject) {
    // append the backend session ID to the xdm.mediaCollection object
    const xdm = getDataObject(data, EVENT_DATA_KEYS.XDM) ?? {};
    const mediaCollection = getDataObject(xdm, MediaConstants.EventDataKeys.MEDIA_COLLECTION) ?? {};
    mediaCollection[MediaConstants.EventDataKeys.SESSION_ID] = this.getBackendSessionId();

    // update the xdm object with the updated mediaCollection object
    xdm[MediaConstants.EventDataKeys.MEDIA_COLLECTION] = mediaCollection;
    // update the data object with the updated xdm object
    data[EVENT_DATA_KEYS.XDM] = xdm;
  }

  /**
   * Returns the request object with the custom path.
   * @param hit The media hit.
   * @returns The request object with the custom path.
   */
  private getRequestObjectWithCustomPath(hit: MediaHit): DataObject {
    // remove media. prefix from eventType
    const eventType = hit.eventType.split(".")[1];

    // path eg: va/v1/sessionStart
    const requestObject = {
      [MediaConstants.EventDataKeys.PATH]: `${MEDIA_PATH_PREFIX}/${eventType}`,
    };

    return requestObject;
  }

  /**
   * Checks the time difference between the current hit and the last hit.
   * Logs a warning if the difference is greater than the maximum ping interval.
   * @param currHitTs timestamp of the current hit.
   */
  private checkPingInterval(currHitTs: number) {
    const lastEventTimestamp = this.getLastEventTimestamp();
    if (lastEventTimestamp === -1) {
      return;
    }

    const timeSinceLastEventInSeconds = (currHitTs - lastEventTimestamp) / 1000;

    if (timeSinceLastEventInSeconds > MAX_PING_INTERVAL_SEC) {
      Log.warning(
        LOG_SOURCE,
        LOG_TAG,
        `checkPingInterval() - Time difference between events (${timeSinceLastEventInSeconds} seconds) is greater than ${MAX_PING_INTERVAL_SEC} seconds. Hits may be dropped on the server side. Please dispatch ping events more frequently.`
      );
    }
  }
}
