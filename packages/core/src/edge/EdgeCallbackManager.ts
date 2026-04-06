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

import { EventData } from "../core/eventhub/EventData";
import { Log } from "../core/utils/Log";
import { EdgeConstants } from "./EdgeConstants";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeCallbackManager";

export type EdgeEventHandles = Array<EventData>;
export type EdgeCallback = (eventHandle: EdgeEventHandles) => void;

export class EdgeCallbackManager {
  // Private static instance of the singleton
  private static instance: EdgeCallbackManager | null;

  // Record to store callbacks
  private callbacks: Record<string, EdgeCallback> = {};

  private edgeEventHandles: Record<string, EdgeEventHandles> = {};

  // Private constructor to prevent instantiation
  private constructor() {}

  /**
   * Get the singleton instance of the EdgeCallbackManager
   * @returns the singleton instance of the EdgeCallbackManager
   * @static method
   */
  public static getInstance(): EdgeCallbackManager {
    if (!EdgeCallbackManager.instance) {
      EdgeCallbackManager.instance = new EdgeCallbackManager();
    }
    return EdgeCallbackManager.instance;
  }

  /**
   * Register a callback for a given event ID
   * @param requestEventId the event ID to register the callback for
   * @param callback the callback to register
   */
  public registerCallback(requestEventId: string, callback: EdgeCallback): void {
    Log.verbose(LOG_SOURCE, LOG_TAG, `Registering callback for event ID: ${requestEventId}`);
    this.callbacks[requestEventId] = callback;
  }

  /**
   * Add an event handle for a given event ID
   * @param requestEventId the event ID to add the event handle for
   * @param eventHandle the event handle to add
   */
  public addEventHandle(requestEventId: string, eventHandle: EventData | null): void {
    if (!eventHandle) {
      return;
    }

    Log.verbose(LOG_SOURCE, LOG_TAG, `Adding event handle for event ID: ${requestEventId}`);

    if (!this.edgeEventHandles[requestEventId]) {
      this.edgeEventHandles[requestEventId] = [];
    }
    this.edgeEventHandles[requestEventId].push(eventHandle);
  }

  /**
   * Unregister a callback for a given event ID
   * Calls the callback with the event handles for the event ID
   * @param requestEventId the event ID to unregister the callback for
   */
  public unregisterCallback(requestEventId: string): void {
    Log.verbose(LOG_SOURCE, LOG_TAG, `Unregistering callback for event ID: ${requestEventId}`);
    const callback = this.callbacks[requestEventId];
    if (callback) {
      callback(this.edgeEventHandles[requestEventId] ?? new Array<EventData>());
    } else {
      Log.verbose(LOG_SOURCE, LOG_TAG, `No callback registered for event ID: ${requestEventId}`);
    }
  }

  // Methods for testing purposes

  /**
   * Get the callback map
   * @returns the callback map
   */
  getCallbackMap(): Record<string, (eventHandle: Array<EventData>) => void> {
    return this.callbacks;
  }

  /**
   * Get the callback for a given event ID
   * @param requestEventId the event ID to get the callback for
   * @returns the callback
   */
  getCallback(requestEventId: string): ((eventHandle: Array<EventData>) => void) | undefined {
    return this.callbacks[requestEventId];
  }

  static reset(): void {
    EdgeCallbackManager.instance = null;
  }
}
