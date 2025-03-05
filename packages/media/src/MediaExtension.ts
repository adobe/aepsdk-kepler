/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { DataObject } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";
import { Event, EventType, EventSource } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { ExtensionContainer, Extension } from "@adobe/kepler-aepcore/dist/core/extension";
import { ServiceLookup } from "@adobe/kepler-aepcore/dist/core/services";
import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";
import { safeStringify } from "@adobe/kepler-aepcore/dist/core/utils/common";
import { MediaSessionManager } from "./MediaSessionManager";
import { MediaState } from "./MediaState";
import {
  getArray,
  getString,
  getDataObjectFromArray,
} from "@adobe/kepler-aepcore/dist/core/utils/DataObjectUtil";
import { getEventDataWithoutPlayerId, getEventType, getPlayerId } from "./MediaEventHelper";
import { MediaHit } from "./MediaHit";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: DataObject, event: Event | null) => void;

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaExtension";

const MEDIA = MediaConstants.Media;
const EDGE_RESPONSE = MediaConstants.Edge.EventData;
const COLLECT_CONSENT_NO = "n";

// Implementation
export class MediaExtension implements Extension {
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private mediaSessionManager: MediaSessionManager | null = null;
  private dispatchFn: DispatchFn | null = null;
  private mediaState: MediaState | null = null;
  public get name(): string {
    return MediaConstants.EXTENSION_NAME;
  }

  public get version(): string {
    return MediaConstants.EXTENSION_VERSION;
  }

  /**
   * Boots the Media extension.
   * @param extensionContainer ExtensionContainer
   * @param serviceLookup ServiceLookup
   */
  async onRegister(
    extensionContainer: ExtensionContainer,
    serviceLookup: ServiceLookup
  ): Promise<void> {
    Log.verbose(LOG_SOURCE, LOG_TAG, "onRegister() - Registering Media extension.");
    this.mediaState = new MediaState();
    this.container = extensionContainer;
    this.serviceLookup = serviceLookup;
    this.dispatchFn = this.dispatchEvent.bind(this);
    this.mediaSessionManager = new MediaSessionManager(this.dispatchFn);
    this.registerListeners();
  }

  /**
   * Dispatches the event to the eventhub.
   * @param event Event
   */
  dispatchEvent(event: Event): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `dispatchEvent() - Dispatching event: (${JSON.stringify(event)}).`
    );

    this.container?.dispatch(event);
  }

  /**
   * Registers the listeners for the Media extension.
   */
  private registerListeners() {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      "registerListeners() - Registering listeners for Media extension."
    );

    // if the container is not available, then return
    if (!this.container) {
      Log.error(LOG_SOURCE, LOG_TAG, "registerListeners() - Container is not available.");
      return;
    }

    this.container.registerEventListener(
      EventType.MEDIA,
      MEDIA.EVENT_SOURCE_CREATE_SESSION,
      (event) => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
        this.createMediaSession(event);
      }
    );

    this.container.registerEventListener(EventType.MEDIA, EventSource.REQUEST_CONTENT, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
      this.sendMediaEvent(event);
    });

    this.container.registerEventListener(
      EventType.EDGE,
      MEDIA.EVENT_SOURCE_MEDIA_EDGE_SESSION,
      (event) => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
        this.notifyBackendSessionId(event);
      }
    );

    this.container.registerEventListener(
      EventType.EDGE,
      EventSource.ERROR_RESPONSE_CONTENT,
      (event) => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
        this.notifyErrorResponse(event);
      }
    );

    this.container.registerEventListener(EventType.HUB, EventSource.SHARED_STATE, (event) => {
      const eventData = event.data;
      const owner = eventData?.getString(MediaConstants.SharedState.KEY_OWNER);

      if (owner !== MediaConstants.EDGE_EXTENSION_NAME) {
        return;
      }

      this.handleSharedStateUpdate(event);
    });
  }

  /**
   * Starts a internal media session for the given player ID. Throws an error if there is an active session.
   * @param event session start event
   * @returns
   */
  private createMediaSession(event: Event): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `createMediaSession() API called with event: \n ${safeStringify(event, null, 2)} `
    );

    if (this.mediaState?.collectConsent === COLLECT_CONSENT_NO) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `createMediaSession() - Collect consent status is set to "n", will not create media session. In order to create media sessions, please set the consent status to "y" and call createMediaSession() API.`
      );
      return;
    }

    const playerId = getPlayerId(event);
    const eventType = getEventType(event);
    const data = getEventDataWithoutPlayerId(event);

    if (!playerId || !eventType || !data) {
      Log.error(LOG_SOURCE, LOG_TAG, "createMediaSession() - Invalid event data or type.");
      return;
    }

    const sessionStartHit = new MediaHit(playerId, event.uuid, eventType, event.timestamp, data);

    this.mediaSessionManager?.startSession(sessionStartHit);
  }

  /**
   * Sends a media event for the currently active media session.
   * Calling createMediaSession() API is required before calling this API.
   * @param event media event
   */
  private sendMediaEvent(event: Event): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `sendMediaEvent() API called with event: \n ${safeStringify(event, null, 2)} `
    );

    if (this.mediaState?.collectConsent === COLLECT_CONSENT_NO) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `sendMediaEvent() - Collect consent status is set to "n", will not send media event. In order to send media events, please set the consent status to "y" and call createMediaSession() API first.`
      );
      return;
    }

    const playerId = getPlayerId(event);
    const eventType = getEventType(event);
    const data = getEventDataWithoutPlayerId(event);

    if (!playerId || !eventType || !data) {
      Log.error(LOG_SOURCE, LOG_TAG, "createMediaSession() - Invalid event data or type.");
      return;
    }

    const mediaHit = new MediaHit(playerId, event.uuid, eventType, event.timestamp, data);

    this.mediaSessionManager?.process(mediaHit);
  }

  private handleSharedStateUpdate(event: Event): void {
    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `handleSharedStateUpdate() - Received Shared state update event: \n ${safeStringify(
        event,
        null,
        2
      )}`
    );

    const edgeSharedStateResult = this.container?.getXDMSharedState(
      MediaConstants.EDGE_EXTENSION_NAME,
      event
    );

    this.mediaState?.updateEdgeState(edgeSharedStateResult);

    if (this.mediaState?.collectConsent === COLLECT_CONSENT_NO) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        `handleSharedStateUpdate() - Received consent status "n", will abort all media sessions.`
      );
      this.mediaSessionManager?.endAllSessions();
    }
  }

  /**
   * Notifies the backend session ID for the given request ID.
   * @param event The event containing the request ID and backend session ID.
   */
  private notifyBackendSessionId(event: Event): void {
    // get requestId from event data
    const requestId = event.parentId;
    if (!requestId) {
      Log.error(LOG_SOURCE, LOG_TAG, "notifyBackendSessionId() - Request ID is null or undefined.");
      return;
    }

    const data = event.data?.getData();
    if (!data) {
      Log.error(LOG_SOURCE, LOG_TAG, "notifyBackendSessionId() - Event data is null or undefined.");
      return;
    }

    const payload = getArray(data, EDGE_RESPONSE.PAYLOAD);

    if (!payload || !Array.isArray(payload) || !payload[0]) {
      Log.error(LOG_SOURCE, LOG_TAG, "notifyBackendSessionId() - Payload is null or undefined.");
      return;
    }

    const firstEntry = getDataObjectFromArray(payload, 0) ?? {};

    const backendSessionId = getString(firstEntry, EDGE_RESPONSE.SESSION_ID);

    if (!backendSessionId) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        "notifyBackendSessionId() - Backend session ID is null or undefined."
      );
      return;
    }

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `notifyBackendSessionId() - Received backend session ID:(${backendSessionId}) for requestId:(${requestId})`
    );

    this.mediaSessionManager?.notifyBackendSessionId(requestId, backendSessionId);
  }

  /**
   * Notifies the error response for the given request ID.
   * @param event The event containing the request ID and error response.
   */
  private notifyErrorResponse(event: Event): void {
    // get requestId from event data
    const requestId = event.parentId;
    if (!requestId) {
      Log.error(LOG_SOURCE, LOG_TAG, "notifyErrorResponse() - Request ID is null or undefined.");
      return;
    }

    const errorData = event.data?.getData() ?? {};
    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `notifyErrorResponse() - Received error response with error data:(${safeStringify(
        errorData,
        null,
        2
      )}) for requestId:(${requestId})`
    );

    this.mediaSessionManager?.notifyErrorResponse(requestId, errorData);
  }

  /**
   * Un-registers the Media extension.
   */
  onUnregister(): void {
    Log.verbose(LOG_SOURCE, LOG_TAG, "onUnregister() - Un-registering Media extension.");
    this.container = null;
    this.serviceLookup = null;
    this.dispatchFn = null;
    this.mediaState = null;
    this.mediaSessionManager = null;
  }
}
