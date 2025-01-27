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
import { MediaConstants } from "./MediaConstants";
import { MediaSession } from "./MediaSession";
import { MediaHit } from "./MediaHit";
import { DataObject } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaSessionManager";

export class MediaSessionManager {
  private _activeSessions: Record<string, MediaSession> = {};

  /**
   * Creates a new media session with the given session ID and configuration.
   *
   * @param sessionId - The session ID to identify the session.
   * @param config - The configuration for the session.
   * @returns boolean - True if the session was created successfully, false otherwise.
   */
  public startSession(sessionId: string, config: DataObject): boolean {
    if (this.isSessionActive(sessionId)) {
      Log.debug(
        MediaConstants.EXTENSION_NAME,
        "MediaSessionManager",
        `Media session with ID: ${sessionId} is already active.`
      );
      return false;
    }

    this.createSession(sessionId, config);

    Log.debug(LOG_SOURCE, LOG_TAG, `Media session with ID: ${sessionId} created.`);
    return true;
  }

  /**
   * Queues a media hit for processing in the media session with the given session ID.
   * @params
   * sessionId - The session ID to queue the hit to.
   * hit - The media hit to be queued.
   * @returns boolean - True if the hit was queued successfully, false otherwise.
   */
  public queue(sessionId: string, hit: MediaHit): boolean {
    if (!this.isSessionActive(sessionId)) {
      Log.debug(LOG_SOURCE, LOG_TAG, `Media session with ID: ${sessionId} is not active.`);
      return false;
    }

    const session = this.getSession(sessionId);
    session?.process(hit);
    return session !== null;
  }

  /**
   * Ends the media session with the given session ID.
   * @param sessionId - The session ID to end.
   * @returns boolean - True if the session was ended successfully, false otherwise.
   */
  public endSession(sessionId: string): boolean {
    if (!this.isSessionActive(sessionId)) {
      Log.debug(LOG_SOURCE, LOG_TAG, `Media session with ID: ${sessionId} is not active.`);
      return false;
    }

    const session = this.getSession(sessionId);
    session?.end();

    this.deleteSession(sessionId);

    Log.debug(LOG_SOURCE, LOG_TAG, `Media session with ID: ${sessionId} has been ended.`);
    return true;
  }

  /**
   * Ends all active media sessions.
   */
  public endAllSessions(): void {
    // call abort for all active sessions
    this._activeSessions = {};
    Log.debug(LOG_SOURCE, LOG_TAG, `All media sessions have been ended.`);
  }

  /**
   * Notifies all active media sessions of an error response.
   * @param requestId - The request ID of the error response.
   * @param data - The error response data.
   */
  notifyErrorResponse(requestId: string, data: Record<string, unknown>): void {
    for (const sessionId in this._activeSessions) {
      if (!this.isSessionActive(sessionId)) {
        continue;
      }

      this.getSession(sessionId)?.handleErrorResponse(requestId, data);
    }
  }

  /**
   * Notifies all active media sessions of a session ID update.
   * @param requestId - The request ID of the session update.
   * @param backendSessionId - The backend session ID returned by the server.
   */
  public notifyBackendSessionId(requestId: string, backendSessionId: string): void {
    for (const sessionId in this._activeSessions) {
      if (!this.isSessionActive(sessionId)) {
        continue;
      }

      this.getSession(sessionId)?.handleSessionUpdate(requestId, backendSessionId);
    }
  }

  /**
   * Notifies all active media sessions of a state update.
   */
  // TODO: check if this is needed
  public notifyStateUpdate(): void {
    for (const sessionId in this._activeSessions) {
      if (!this.isSessionActive(sessionId)) {
        continue;
      }

      this.getSession(sessionId)?.handleStateUpdate();
    }
  }

  /**
   * Creates the session with the given session ID and configuration and caches the session in the active sessions.
   * @param sessionId
   * @param config
   */
  private createSession(sessionId: string, config: DataObject): void {
    this._activeSessions[sessionId] = new MediaSession(sessionId, config);
  }

  /**
   * Returns the media session with the given session ID if it is active.
   * @param sessionId - The session ID of the media session.
   * @returns MediaSession | null - The media session if it is active, null otherwise.
   */
  getSession(sessionId: string): MediaSession | null {
    return this._activeSessions[sessionId] ?? null;
  }

  /**
   * Deletes the media session with the given session ID.
   * @param sessionId - The session ID of the media session to delete.
   */
  deleteSession(sessionId: string): void {
    delete this._activeSessions[sessionId];
  }

  /**
   * Checks if the media session with the given session ID is active.
   * @param sessionId - The session ID of the media session.
   * @returns boolean - True if the session is active, false otherwise.
   */
  isSessionActive(sessionId: string): boolean {
    const session = this.getSession(sessionId);

    return session != null && session.isActive;
  }
}
