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
import { SHARED_STATE_NAME, SHARED_STATE_KEY_OWNER } from "./Constants";
import { EventData } from "../eventhub";

/**
 * Builds a shared state event with the given extension name.
 *
 * @param extensionName The name of the extension
 * @returns The shared state event
 */
export function buildSharedStateEvent(extensionName: string): Event {
  return new Event(
    SHARED_STATE_NAME,
    EventType.HUB,
    EventSource.SHARED_STATE,
    EventData.buildFrom({
      [SHARED_STATE_KEY_OWNER]: extensionName,
    })
  );
}
