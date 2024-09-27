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
import { Event, EventType, EventSource } from "../eventhub";
/* eslint-disable @typescript-eslint/no-explicit-any */

export function buildSharedStateEvent(extensionName: string, state: Map<string, any>): Event {
  //TODO: update the event name
  return new Event(
    "sharedstate",
    EventType.HUB,
    EventSource.SHARED_STATE,
    new Map([["stateowner", extensionName]])
  );
}

export function buildPendingSharedStateEvent(
  extensionName: string,
  state: Map<string, any>
): Event {
  //TODO: update the event name
  return new Event(
    "penddingstate",
    EventType.HUB,
    EventSource.SHARED_STATE,
    new Map([
      ["stateowner", extensionName],
      ["status", "PENDING"],
    ])
  );
}

export function extractSharedState(event: Event): Map<string, any> | null {
  if (event.source === EventSource.SHARED_STATE && event.type === EventType.HUB) {
    return event.data;
  }
  return null;
}
