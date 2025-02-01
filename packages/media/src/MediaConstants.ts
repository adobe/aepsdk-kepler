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

export const MediaConstants = {
  EXTENSION_NAME: "com.adobe.edge.media",
  FRIENDLY_NAME: "Media",
  EXTENSION_VERSION: "1.0.0-beta.1",

  Media: {
    EVENT_NAME_CREATE_SESSION: "createMediaSession",
    EVENT_NAME_SEND_MEDIA_EVENT: "sendMediaEvent",
    EVENT_SOURCE_CREATE_SESSION: "com.adobe.eventSource.createSession",
    EVENT_SOURCE_MEDIA_EDGE_SESSION: "media-analytics:new-session",
  },

  EventDataKeys: {
    XDM: "xdm",
    EVENT_TYPE: "eventType",
    SESSION_ID: "sessionId",
  },

  Edge: {
    EventData: {
      PAYLOAD: "payload",
      SESSION_ID: "sessionId",
      PATH: "path",
      REQUEST_ID: "requestId",
      REQUEST: "request",
    },

    ErrorKeys: {
      STATUS: "status",
      TYPE: "type",
    },

    ErrorData: {
      ERROR_CODE_400: 400,
      ERROR_TYPE_VA_EDGE_400: "https://ns.adobe.com/aep/errors/va-edge-0400-400",
    },
  },

  EventType: {
    SESSION_START: "media.sessionStart",
    PLAY: "media.play",
    PING: "media.ping",
    BITRATE_CHANGE: "media.bitrateChange",
    BUFFER_START: "media.bufferStart",
    PAUSE_START: "media.pauseStart",
    AD_BREAK_START: "media.adBreakStart",
    AD_START: "media.adStart",
    AD_COMPLETE: "media.adComplete",
    AD_SKIP: "media.adSkip",
    AD_BREAK_COMPLETE: "media.adBreakComplete",
    CHAPTER_START: "media.chapterStart",
    CHAPTER_COMPLETE: "media.chapterComplete",
    CHAPTER_SKIP: "media.chapterSkip",
    ERROR: "media.error",
    STATES_UPDATE: "media.statesUpdate",
    SESSION_END: "media.sessionEnd",
    SESSION_COMPLETE: "media.sessionComplete",
  },
} as const;
