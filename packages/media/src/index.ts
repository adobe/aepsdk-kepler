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
import { getEventDispatcher } from "@adobe/vega-aepcore/dist/Core";
import { Event, EventType, EventSource, EventData } from "@adobe/vega-aepcore/dist/core/eventhub";
import { Extension } from "@adobe/vega-aepcore/dist/core/extension";
import { safeStringify } from "@adobe/vega-aepcore/dist/core/utils/common";
import { MediaInterface } from "./MediaInterface";
import { MediaConstants } from "./MediaConstants";
import { MediaExtension } from "./MediaExtension";
import { isValidMediaXDMData } from "./MediaAPIHelper";

const LOG_EXTENSION = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaAPI";

const DEFAULT_PLAYER_ID: string = "default";
const MEDIA = MediaConstants.Media;
const EVENT_DATA_KEYS = MediaConstants.EventDataKeys;

class MediaAPI implements MediaInterface {
  readonly EXTENSION: Extension = new MediaExtension();

  // public APIs

  /**
   * Creates a new media session with the given XDM data.
   * @param data the XDM data of type "media.sessionStart".
   */
  createMediaSession(data: Record<string, unknown>): void {
    Log.verbose(
      LOG_EXTENSION,
      LOG_TAG,
      `createMediaSession() API called with data: \n ${safeStringify(data, null, 2)} \n}`
    );

    const eventData = EventData.buildFrom(data);

    if (!isValidMediaXDMData(eventData)) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        `createMediaSession() - Invalid event data: ${safeStringify(eventData, null, 2)} passed.`
      );
      return;
    }

    // Add default playerId to the event data
    eventData?.updateData([EVENT_DATA_KEYS.PLAYER_ID], DEFAULT_PLAYER_ID);

    const event = Event.builder(
      MEDIA.EVENT_NAME_CREATE_SESSION,
      EventType.MEDIA,
      MEDIA.EVENT_SOURCE_CREATE_SESSION,
      eventData
    ).build();

    getEventDispatcher().dispatch(event);
  }

  /**
   * Sends a media event for the currently active media session.
   * Calling createMediaSession() API is required before calling this API.
   *
   * @param data the XDM data of the Media event.
   */
  sendMediaEvent(data: Record<string, unknown>): void {
    Log.verbose(
      LOG_EXTENSION,
      LOG_TAG,
      `sendMediaEvent() API called with data: \n ${safeStringify(data, null, 2)} `
    );

    const eventData = EventData.buildFrom(data);

    if (!isValidMediaXDMData(eventData)) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        `sendMediaEvent() - Invalid event data: ${safeStringify(eventData, null, 2)} passed.`
      );
      return;
    }

    // Add default playerId to the event data
    eventData?.updateData([EVENT_DATA_KEYS.PLAYER_ID], DEFAULT_PLAYER_ID);

    const event = Event.builder(
      MEDIA.EVENT_NAME_SEND_MEDIA_EVENT,
      EventType.MEDIA,
      EventSource.REQUEST_CONTENT,
      eventData
    ).build();

    getEventDispatcher().dispatch(event);
  }
}

export const Media: MediaInterface = new MediaAPI();
