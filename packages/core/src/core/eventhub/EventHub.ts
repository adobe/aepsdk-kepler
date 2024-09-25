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

export type EventListener = (event: Event) => void;

export type EventProcessor = (event: Event) => Event;

export interface EventHub {
  /**
   * The version of the event hub
   */
  version: string;

  /**
   * Listen an event
   *
   * @param eventType    The type of event
   * @param EventSource  The source of the event
   * @param listener     The listener to be called when the event is emitted
   * @returns            The id of the listener
   */
  on(eventType: string, EventSource: string, listener: EventListener): string;

  /**
   * Emit an event
   *
   * @param event  The event to be emitted
   *
   */
  dispatchEvent(event: Event): void;

  /**
   * Emit an event and await the related response event.
   *
   * @param event  The event to be emitted
   * @returns      The response event
   */
  dispatchEventWithResponseHandling(event: Event): Promise<Event>;

  /**
   * Start the event hub.
   */
  start(): void;

  /**
   * Register an event processor. All events will be processed by the processor before sending to the listeners.
   */
  registerEventProcessor(processor: EventProcessor): void;

  // TODO: Think about adding more methods to the interface, such as unregisterListener(), Stop(), Shutdown(), etc.
}
