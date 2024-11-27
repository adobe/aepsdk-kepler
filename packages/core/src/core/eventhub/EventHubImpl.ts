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
import { EventHub, EventProcessor, Event } from ".";
import { LOG_SOURCE } from "../CoreConstants";
import { EventListenerManager, EventListenerCallback } from "./EventListenerManager";

const LOG_TAG = "EventHubImpl";

export class EventHubImpl implements EventHub {
  private isStarted: boolean = false;
  private eventQueue: Event[] = [];
  private processors: EventProcessor[] = [];
  private currentEventId: number = 1;
  private eventListenerManager: EventListenerManager = new EventListenerManager();

  start(): void {
    this.isStarted = true;
    this.eventQueue.forEach((event) => this.dispatchEvent(event));
    this.eventQueue = [];
  }

  registerEventProcessor(processor: EventProcessor): void {
    this.processors.push(processor);
  }

  on(eventType: string, EventSource: string, listener: EventListenerCallback): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `Registering listener for event type: ${eventType}, source: ${EventSource}`
    );

    this.eventListenerManager.addEventListener(eventType, EventSource, listener);
  }

  dispatchEvent(event: Event): void {
    // assign an incrementatl id to the event
    event.id = this.currentEventId++;

    if (!this.isStarted) {
      Log.debug(LOG_SOURCE, LOG_TAG, `EventHub is not yet started, event is queued: ${event}`);
      this.eventQueue.push(event);
      return;
    }

    Log.debug(LOG_SOURCE, LOG_TAG, `Event is dispatched: ${event}`);
    const processedEvent = this.processEvent(event);

    this.eventListenerManager.processListeners(processedEvent);

    return;
  }

  registerOneTimeEventListener(
    triggerEvent: Event,
    eventType: string,
    eventSource: string,
    listener: EventListenerCallback
  ): void {
    this.eventListenerManager.addOneTimeResponseListener(
      triggerEvent,
      eventType,
      eventSource,
      listener
    );
  }

  /**
   * Process the event with all the processors. The event will be processed by all the processors in the order they are registered.
   * The event data may be modified by the processors by calling "Event.cloneWithEventData()".
   *
   * @param event the event to be processed
   * @returns the event after being processed
   */
  private processEvent(event: Event): Event {
    this.processors.forEach((process) => {
      try {
        event = process(event);
      } catch (e) {
        Log.error(LOG_SOURCE, LOG_TAG, `Error processing event: ${event}, error: ${e}`);
      }
    });
    return event;
  }
}
