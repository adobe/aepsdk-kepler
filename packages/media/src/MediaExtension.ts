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
import {
  getArray,
  getString,
  getDataObjectFromArray,
} from "@adobe/kepler-aepcore/dist/core/utils/DataObjectUtil";
import { getEventDataWithoutSessionId, getEventType, getSessionId } from "./MediaEventHelper";
import { MediaHit } from "./MediaHit";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: DataObject, event: Event | null) => void;

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaExtension";

const MEDIA = MediaConstants.Media;
const EDGE_RESPONSE = MediaConstants.Edge.EventData;

// Implementation
export class MediaExtension implements Extension {
  private _isActive: boolean = false;
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private mediaSessionManager: MediaSessionManager | null = null;
  private dispatchFn: DispatchFn | null = null;

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
    this._isActive = true;
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
    if (this.isActive()) {
      // dispatch the event to the event hub
      this.container?.dispatch(event);
    }
  }

  /**
   * Returns the status of the Media extension.
   * @returns boolean true if the extension is active, false otherwise.
   */
  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Registers the listeners for the Media extension.
   */
  private registerListeners() {
    if (!this.isActive()) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "registerListeners() - Cannot register listeners. Media extension is not active."
      );
      return;
    }

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

    const sessionId = getSessionId(event);
    const eventType = getEventType(event);
    const data = getEventDataWithoutSessionId(event);

    if (!sessionId || !eventType || !data) {
      Log.error(LOG_SOURCE, LOG_TAG, "createMediaSession() - Invalid event data or type.");
      return;
    }

    const sessionStartHit = new MediaHit(sessionId, event.uuid, eventType, event.timestamp, data);

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

    const sessionId = getSessionId(event);
    const eventType = getEventType(event);
    const data = getEventDataWithoutSessionId(event);

    if (!sessionId || !eventType || !data) {
      Log.error(LOG_SOURCE, LOG_TAG, "createMediaSession() - Invalid event data or type.");
      return;
    }

    const mediaHit = new MediaHit(sessionId, event.uuid, eventType, event.timestamp, data);

    this.mediaSessionManager?.process(mediaHit);
  }

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

    this.mediaSessionManager?.notifyBackendSessionId(requestId, backendSessionId);
  }

  private notifyErrorResponse(event: Event): void {
    // get requestId from event data
    const requestId = event.parentId;
    if (!requestId) {
      Log.error(LOG_SOURCE, LOG_TAG, "notifyErrorResponse() - Request ID is null or undefined.");
      return;
    }

    const errorData = event.data?.getData() ?? {};
    this.mediaSessionManager?.notifyErrorResponse(requestId, errorData);
  }

  /**
   * Un-registers the Media extension.
   */
  onUnregister(): void {
    this._isActive = false;
  }
}
