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
import { EventHub, EventListener, EventProcessor, Event } from ".";

export class EventHubImpl implements EventHub {
  private isStarted: boolean = false;
  private listeners: Map<string, EventListener[]> = new Map();
  private eventQueue: Event[] = [];
  private processors: EventProcessor[] = [];
  private currentEventId: number = 1;

  start(): void {
    this.eventQueue.forEach((event) => this.dispatchEvent(event));
    this.isStarted = true;
    this.eventQueue = [];
  }

  registerEventProcessor(processor: EventProcessor): void {
    this.processors.push(processor);
  }

  on(eventType: string, EventSource: string, listener: EventListener): void {
    const key = this.generateListenerKey(eventType, EventSource);
    if (this.listeners.has(key)) {
      this.listeners.get(key)?.push(listener);
    } else {
      this.listeners.set(key, [listener]);
    }
  }

  dispatchEvent(event: Event): void {
    // assign an incrementatl id to the event
    event.id = this.currentEventId++;

    if (!this.isStarted) {
      Log.debug(`EventHub is not yet started, event is queued: ${event}`);
      this.eventQueue.push(event);
      return;
    }

    Log.debug(`Event is dispatched: ${event}`);
    const processedEvent = this.processEvent(event);

    const key = this.generateListenerKey(processedEvent.type, processedEvent.source);
    this.listeners.get(key)?.forEach((listen) => listen(processedEvent));
    return;
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
        Log.error(`Error processing event: ${event}, error: ${e}`);
      }
    });
    return event;
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
}
