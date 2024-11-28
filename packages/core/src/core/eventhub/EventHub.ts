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
import { Event } from ".";
import { EventListenerCallback } from "./EventListenerCallback";

/**
 * Processes the event before dispatching to the listeners
 *
 * @param event  The event to be processed
 * @returns The processed event
 */
export type EventProcessor = (event: Event) => Event;

export interface EventHub {
  /**
   * Observes events of particular type and source and notifies observers
   *
   * @param eventType    The type of event
   * @param eventSource  The source of the event
   * @param listener     The listener to be called when the event is dispatched
   */
  on(eventType: string, eventSource: string, listener: EventListenerCallback): void;

  /**
   * Dispatch an event
   *
   * @param event  The event to be dispatched
   *
   */
  dispatchEvent(event: Event): void;

  /**
   * Start the event hub.
   */
  start(): void;

  /**
   * Register an event processor. All events will be processed by the processor before sending to the listeners.
   */
  registerEventProcessor(processor: EventProcessor): void;
}
