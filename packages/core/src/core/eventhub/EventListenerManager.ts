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
import { Log } from "../utils/Log";
import { Event } from ".";
import { LOG_SOURCE } from "../CoreConstants";

const LOG_TAG = "EventListenerManager";

/**
 * Invoked when the specified event is dispatched.
 *
 * @param event  The event that is dispatched
 */
export type EventListenerCallback = (event: Event) => void;

export class EventListenerManager {
  private eventListeners: Map<string, EventListener[]> = new Map();
  private oneTimeListeners: Map<string, EventListener[]> = new Map();

  /**
   * Add an event listener for the specified event type and source.
   * The listener will be invoked when the specified event is dispatched.
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @param listener the listener to be invoked when the specified event is dispatched
   */
  addEventListener(eventType: string, eventSource: string, listener: EventListenerCallback): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Adding listener for event type: ${eventType}, source: ${eventSource}`
    );

    const key = this.generateListenerKey(eventType, eventSource);
    const listenerObj = new EventListener(eventType, eventSource, listener);
    if (this.eventListeners.has(key)) {
      this.eventListeners.get(key)?.push(listenerObj);
    } else {
      this.eventListeners.set(key, [listenerObj]);
    }
  }

  /**
   * Add a one-time event listener for the specified event type and source.
   * The listener will be invoked when the specified event containing uuid
   * of the triggering event as parentId is dispatched.
   * @param triggerEvent the event that triggers the response
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @param listener the listener to be invoked when the specified event is dispatched
   */
  addOneTimeResponseListener(
    triggerEvent: Event,
    eventType: string,
    eventSource: string,
    listener: EventListenerCallback
  ): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Adding response listener for event type: ${eventType}, source: ${eventSource}, trigger event: ${triggerEvent}`
    );

    // Key will start with the  uuid of the trigger event
    // Response event will contain this uuid as parentId
    const oneTimeKey = this.generateIdPrefixedKey(triggerEvent.uuid, eventType, eventSource);

    const onetimeListenerObj = new EventListener(eventType, eventSource, listener, true);
    if (this.oneTimeListeners.has(oneTimeKey)) {
      this.oneTimeListeners.get(oneTimeKey)?.push(onetimeListenerObj);
    } else {
      this.oneTimeListeners.set(oneTimeKey, [onetimeListenerObj]);
    }
  }

  /**
   * Get the map of registered event listeners
   * @returns the map of event listeners
   */
  getListeners(eventType: string, eventSource: string): EventListener[] {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Getting listeners for event type: ${eventType}, source: ${eventSource}`
    );
    const key = this.generateListenerKey(eventType, eventSource);

    return this.eventListeners.get(key) || [];
  }

  /**
   * Get the map of registered one-time event listeners
   * @returns the map of one-time event listeners
   * @param triggerEvent the event that triggers the response
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @returns the list of one-time event listeners
   */
  getOneTimeResponseListeners(
    triggerEvent: Event,
    eventType: string,
    eventSource: string
  ): EventListener[] {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Getting response listeners for event type: ${eventType}, source: ${eventSource}, trigger event: ${triggerEvent}`
    );
    // Key will start with the parent id of the trigger event
    // Which is the id of the event waiting for response
    const responseKey = this.generateIdPrefixedKey(triggerEvent.parentId, eventType, eventSource);

    return this.oneTimeListeners.get(responseKey) || [];
  }

  /**
   * Process all the event listeners and one-time event listeners for the specified event.
   * @param event the event to be processed
   */
  processListeners(event: Event): void {
    const eventType = event.type;
    const eventSource = event.source;

    // get all the matching listeners
    const listeners = this.getListeners(eventType, eventSource);

    // get all the matching one-time listeners
    const oneTimeListeners = this.getOneTimeResponseListeners(event, eventType, eventSource);

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Processing listeners for event type: ${eventType}, source: ${eventSource}`
    );

    // Process the event listeners
    listeners.forEach((listener) => {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `Calling listener for event type: ${eventType}, source: ${eventSource}`
      );
      const callback = listener.getCallback();
      callback(event);
    });

    // Process the one-time event listeners
    oneTimeListeners.forEach((listener) => {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `Calling one-time listener for event type: ${eventType}, source: ${eventSource}`
      );
      const callback = listener.getCallback();
      callback(event);
    });

    // Remove the one-time listeners after processing
    this.removeOneTimeEventListener(event, eventType, eventSource);
  }

  /**
   * Remove all the event listeners for the specified event type and source.
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @param listener the listener to be removed
   */
  removeOneTimeEventListener(responseEvent: Event, eventType: string, eventSource: string): void {
    const responseKey = this.generateIdPrefixedKey(responseEvent.parentId, eventType, eventSource);
    this.oneTimeListeners.delete(responseKey);
  }

  /**
   * Generate a key for the listener with the eventId prefixed.
   * EventId is the uuid of the event that triggers the response
   * or the parentId of the response event
   * which is the id of the event waiting for response.
   * @param eventId the id of the event
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @returns the key for the listener in the format of "eventId:eventType:eventSource"
   */
  private generateIdPrefixedKey(eventId: string, eventType: string, eventSource: string): string {
    return `${eventId}:${this.generateListenerKey(eventType, eventSource)}`;
  }

  /**
   * Generate a key for the listener
   *
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @returns the key for the listener in the format of "eventType:eventSource"
   */
  private generateListenerKey(eventType: string, eventSource: string): string {
    return `${eventType}:${eventSource}`;
  }

  // Added for testing purposes

  /**
   * Get the map of registered event listeners
   * @returns the map of event listeners
   */
  getEventListenerMap(): Map<string, EventListener[]> {
    return this.eventListeners;
  }

  /**
   * Get the map of registered one-time event listeners
   * @returns the map of one-time event listeners
   */
  getOneTimeListenerMap(): Map<string, EventListener[]> {
    return this.oneTimeListeners;
  }
}

export class EventListener {
  constructor(
    private eventType: string,
    private eventSource: string,
    private callback: (event: Event) => void,
    private oneTime: boolean = false,
    private timestamp: number = Date.now(),
    private timeout: number = -1
  ) {}

  isExpired(): boolean {
    if (this.timeout === -1) {
      return false;
    }

    const currentTime = Date.now();
    const timeElapsed = currentTime - this.timestamp;
    return timeElapsed > this.timeout;
  }

  isOneTime(): boolean {
    return this.oneTime;
  }

  getCallback(): (event: Event) => void {
    return this.callback;
  }

  getTimestamp(): number {
    return this.timestamp;
  }

  getTimeout(): number {
    return this.timeout;
  }

  getEventType(): string {
    return this.eventType;
  }

  getEventSource(): string {
    return this.eventSource;
  }
}
