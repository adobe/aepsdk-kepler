/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Event } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { MediaConstants } from "./MediaConstants";
import { getString } from "@adobe/kepler-aepcore/dist/core/utils/DataObjectUtil";
import { DataObject } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";

export function getEventType(event: Event): string | null {
  const eventData = event.data;
  const xdmData = eventData?.getDataObject(MediaConstants.EventDataKeys.XDM) ?? {};
  const eventType = getString(xdmData, MediaConstants.EventDataKeys.EVENT_TYPE) ?? null;

  return eventType;
}

export function getEventData(event: Event): DataObject | null {
  const eventData = event.data?.getData() ?? null;

  return eventData;
}

export function getEventDataWithoutPlayerId(event: Event): DataObject {
  const eventData = getEventData(event) ?? {};
  delete eventData[MediaConstants.EventDataKeys.PLAYER_ID];

  return eventData;
}

export function getPlayerId(event: Event): string {
  const eventData = event.data;
  const playerId = eventData?.getString(MediaConstants.EventDataKeys.PLAYER_ID) ?? "";

  return playerId;
}
