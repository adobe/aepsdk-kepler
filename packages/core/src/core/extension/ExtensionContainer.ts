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
import { EventListener, Event } from "../eventhub";
import { SharedStateResult } from "../sharedstate";
import { EventData } from "../eventhub";

export interface ExtensionContainer {
  /**
   * Register an event listener for the specified event type and event source.
   *
   * @param eventType The type of the event
   * @param eventSource The source of the event
   * @param listener The event listener
   */
  registerEventListener(eventType: string, eventSource: string, listener: EventListener): void;

  /**
   * Creates a new shared state for this extension. If event is null, one of two behaviors will be observed:
   *  1. If this extension has not previously published a shared state, shared state will be versioned at 0.
   *  2. If this extension has previously published a shared state, shared state will be versioned at the latest.
   *
   * @param state An EventData object representing current state of this extension
   * @param event The event for which the state is being set.
   */
  createXDMSharedState(state: EventData, event: Event | null): void;

  /**
   * Creates a pending shared state for this extension.
   *
   * @param event The event for which pending shared state is being set.
   */
  createPendingXDMSharedState(event: Event | null): Promise<SharedStateResolver>;

  /**
   * Gets the shared state data for a specified extension.
   *
   * @param extensionName  The extension name for which to retrieve data.
   * @param event The event for which the state is being requested.
   */
  getXDMSharedState(extensionName: string, event: Event | null): SharedStateResult | null;

  /**
   * Dispatches an EVENT to the EventHub.
   *
   * @param event An Event to be dispatched to the EventHub.
   */
  dispatch(event: Event): void;
}

export type SharedStateResolver = (state: EventData | null) => void;
