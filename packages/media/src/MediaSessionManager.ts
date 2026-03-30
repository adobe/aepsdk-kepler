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

import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";
import { MediaSession } from "./MediaSession";
import { MediaHit } from "./MediaHit";
import { DataObject } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";
import { DispatchFn } from "./MediaExtension";

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaSessionManager";

export class MediaSessionManager {
  private _activeSessions: Map<string, MediaSession> = new Map();

  constructor(private dispatchFn: DispatchFn) {}

  /**
   * Creates a new media session with the given media hit and configuration.
   *
   * @param hit - The media hit to start the session.
   * @param config - The configuration for the session.
   * @returns boolean - True if the session was created successfully, false otherwise.
   */
  public startSession(hit: MediaHit, config: DataObject = {}): boolean {
    const session = this.getSession(hit.playerId);
    if (session) {
      Log.debug(
        MediaConstants.EXTENSION_NAME,
        "MediaSessionManager",
        `Media session with playerId:(${hit.playerId}) is already active.`
      );
      return false;
    }

    this.createSession(hit.playerId, this.dispatchFn, config);
    this.process(hit);

    Log.debug(LOG_SOURCE, LOG_TAG, `Media session with playerId:(${hit.playerId}) created.`);
    return true;
  }

  /**
   * Processes the media event and sends the hit to the respective media session if active.
   * @param hit - The media hit to process.
   * @returns boolean - True if the event was processed successfully, false otherwise.
   */
  public process(hit: MediaHit): boolean {
    Log.debug(LOG_SOURCE, LOG_TAG, `Processing media event: ${JSON.stringify(hit)}`);

    const session = this.getSession(hit.playerId);

    // Process the hits
    session?.process(hit);

    // End the session if the event is a session complete or session end event and remove the session from the active sessions.
    if (this.isSessionEndOrComplete(hit)) {
      this.endSession(hit.playerId);
    }

    return session ? true : false;
  }

  /**
   * Ends the media session with the given player ID.
   * @param playerId - The player ID to end.
   * @returns boolean - True if the session was ended successfully, false otherwise.
   */
  public endSession(playerId: string): boolean {
    const session = this.getSession(playerId);

    if (!session) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        `Media session with playerId:(${playerId}) not found or is inactive.`
      );
      return false;
    }

    session.end();

    this.deleteSession(playerId);

    Log.debug(LOG_SOURCE, LOG_TAG, `Media session with playerId: ${playerId} has been ended.`);
    return true;
  }

  /**
   * Ends all active media sessions.
   */
  public endAllSessions(): void {
    for (const session of this._activeSessions.values()) {
      session.end();
    }
    Log.debug(LOG_SOURCE, LOG_TAG, `All media sessions have been ended.`);
    this._activeSessions.clear();
  }

  /**
   * Notifies all active media sessions of an error response.
   * @param requestId - The request ID of the error response.
   * @param data - The error response data.
   */
  public notifyErrorResponse(requestId: string, data: DataObject): void {
    for (const session of this._activeSessions.values()) {
      session.handleErrorResponse(requestId, data);
    }
  }

  /**
   * Notifies all active media sessions of a session ID update.
   * @param requestId - The request ID of the session update.
   * @param backendSessionId - The backend session ID returned by the server.
   */
  public notifyBackendSessionId(requestId: string, backendSessionId: string): void {
    for (const session of this._activeSessions.values()) {
      session.handleSessionUpdate(requestId, backendSessionId);
    }
  }

  /**
   * Creates the session with the given player ID and configuration and caches the session in the active sessions.
   * @param playerId - The player ID of the media session.
   * @param dispatchFn - The dispatch function to dispatch the media edge events to the event hub.
   * @param config - The configuration for the media session.
   */
  private createSession(playerId: string, dispatchFn: DispatchFn, config: DataObject): void {
    this._activeSessions.set(playerId, new MediaSession(playerId, dispatchFn, config));
  }

  /**
   * Returns the media session with the given player ID if it is active.
   * @param playerId - The player ID of the media session.
   * @returns MediaSession | null - The media session if it is active, null otherwise.
   */
  public getSession(playerId: string): MediaSession | null {
    const session = this._activeSessions.get(playerId);
    if (!session || !session.isActive()) {
      Log.verbose(LOG_SOURCE, LOG_TAG, `Media session with playerId: ${playerId} is not active.`);
      return null;
    }

    return session;
  }

  /**
   * Deletes the media session with the given player ID.
   * @param playerId - The player ID of the media session to delete.
   */
  private deleteSession(playerId: string): void {
    this._activeSessions.delete(playerId);
  }

  /**
   * Checks if the given event is a session end event.
   * @param event - The event to check.
   * @returns boolean - True if the event is a session end event, false otherwise.
   */
  private isSessionEndOrComplete(hit: MediaHit): boolean {
    return (
      hit.eventType === MediaConstants.EventType.SESSION_COMPLETE ||
      hit.eventType === MediaConstants.EventType.SESSION_END
    );
  }
}
