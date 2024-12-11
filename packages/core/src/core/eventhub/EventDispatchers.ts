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

import { EventHub, Event, EventListenerCallback } from ".";

const DEFAULT_RESPONSE_TIMEOUT = 5000;

export interface EventDispatcher {
  dispatch(event: Event): void;
  dispatchWithResponse(triggerEvent: Event, timeout?: number): Promise<Event>;
}

export class EventDispatcherInternal implements EventDispatcher {
  private pendingResponses: Map<string, [number, EventListenerCallback]> = new Map();
  private eventHub: EventHub | null = null;

  setEventHub(eventHub: EventHub): void {
    this.eventHub = eventHub;
    this.eventHub.registerEventProcessor((event) => {
      this.processEvents(event);
      return event;
    });
  }

  processEvents(event: Event): void {
    if (event.responseId) {
      const triggerEventId = event.responseId;
      const response = this.pendingResponses.get(triggerEventId);
      if (response) {
        if (response[0] > Date.now()) {
          response[1](event);
        }
        this.pendingResponses.delete(triggerEventId);
      }
    }
  }

  dispatch(event: Event): void {
    this.eventHub?.dispatchEvent(event);
  }

  dispatchWithResponse(
    triggerEvent: Event,
    timeout: number = DEFAULT_RESPONSE_TIMEOUT
  ): Promise<Event> {
    if (!this.eventHub) {
      return Promise.reject(new Error("EventHub is not set"));
    }
    return new Promise((resolve, reject) => {
      // Set up a timer to reject the promise when the timeout is reached
      const timer = setTimeout(() => {
        reject(new Error("API Timed out waiting for response"));
      }, timeout);
      this.dispatchWithResponseCallback(triggerEvent, timeout, (event) => {
        clearTimeout(timer);
        resolve(event);
      });
    });
  }

  private dispatchWithResponseCallback(
    triggerEvent: Event,
    timeout: number,
    callback: EventListenerCallback
  ): void {
    const expiredTimestamp = triggerEvent.timestamp + timeout;
    this.pendingResponses.set(triggerEvent.uuid, [expiredTimestamp, callback]);
    this.dispatch(triggerEvent);
  }
}
