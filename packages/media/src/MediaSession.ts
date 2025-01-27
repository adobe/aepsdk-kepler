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

import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { uuid } from "@adobe/kepler-aepcore/dist/core/utils/uuid";
import { MediaConstants } from "./MediaConstants";
import { MediaHit } from "./MediaHit";

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaSession";

const MEDIA_PATH_PREFIX: string = "/va/v1";
const SESSION_IDLE_THRESHOLD_SEC: number = 30 * 60; // 30 minutes
const LONG_SESSION_THRESHOLD_SEC: number = 24 * 60 * 60; // 24 hours
const DEFAULT_PING_INTERVAL_SEC: number = 10; // 10 seconds
const MIN_MAIN_PING_INTERVAL_SEC: number = 10; // 10 seconds
const MAX_MAIN_PING_INTERVAL_SEC: number = 50; // 50 seconds
const MIN_AD_PING_INTERVAL_SEC: number = 1; // 1 second
const MAX_AD_PING_INTERVAL_SEC: number = 10; // 10 seconds

const MEDIA_EVENT_TYPE = MediaConstants.EventType;
const RESPONSE_CODE = MediaConstants.Network.ResponseCode;
const ERROR_TYPE = MediaConstants.Network.ErrorType;
const HANDLE_TYPE_SESSION_START = MediaConstants.EdgeResponse.HandleType.SESSION_START;

export class MediaSession {
  isActive: boolean = false;

  private clientSessionId: string;
  private sessionId: string;
  private configuration: Record<string, unknown> = {};

  private sessionChannelName: string | null = null;
  private sessionPlayerName: string | null = null;
  private sessionAdPingInterval: number | null = null;
  private sessionMainPingInterval: number | null = null;

  private backendSessionId: string | null = null;
  private hitQueue: Array<MediaHit> = [];
  private sessionStartRequestId: string | null = null;

  constructor(clientSessionId: string, configuration: Record<string, unknown> = {}) {
    this.clientSessionId = clientSessionId;
    this.configuration = configuration;
    this.sessionId = uuid();
    this.isActive = true;
  }

  getClientSessionId(): string {
    return this.clientSessionId;
  }

  queue(hit: MediaHit): boolean {
    if (!this.isActive) {
      Log.error(LOG_SOURCE, LOG_TAG, "Media session is not active. Cannot queue hits.");
      return false;
    }

    this.hitQueue.push(hit);
    return true;
  }

  process(hit: MediaHit) {
    this.queue(hit);
    this.tryDispatchMediaEvents();
  }

  tryDispatchMediaEvents() {}

  abort() {}

  end() {}

  getHitQueueSize() {
    return this.hitQueue.length;
  }

  getBackendSessionId(): string | null {
    return this.backendSessionId;
  }

  handleSessionUpdate(requestId: string, backendSessionId: string) {
    if (this.sessionStartRequestId === requestId) {
      Log.debug(LOG_SOURCE, LOG_TAG, `Received backend session ID: ${backendSessionId}`);
      this.backendSessionId = backendSessionId;
    }
  }

  handleErrorResponse(requestId: string, data: Record<string, unknown>) {}

  handleStateUpdate() {}
}
