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

import { EventData } from "../core/eventhub/EventData";
import { Edge } from "./Edge";
import { Extension } from "../core/extension";
import { safeStringify } from "../core/utils/common";
import { EdgeExtension } from "./EdgeExtension";
import { EdgeConstants } from "./EdgeConstants";
import { Log } from "../core/utils/Log";

import { getEventDispatcher } from "../Core";
import { Event, EventType, EventSource } from "../core/eventhub";
import { EdgeCallbackManager } from "./EdgeCallbackManager";

const LOG_EXTENSION = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeAPI";

export class EdgeAPI implements Edge {
  readonly EXTENSION: Extension = new EdgeExtension();

  // public APIs
  sendEvent(data: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
    // Send event
    Log.verbose(
      LOG_EXTENSION,
      LOG_TAG,
      `sendEvent() - Sending Event with data: ${safeStringify(data, null, 2)}`
    );

    const cleanedData = clearEventDataForSendEvent(data);
    const eventData = EventData.buildFrom(cleanedData);

    if (!eventData) {
      Log.error(LOG_EXTENSION, LOG_TAG, "sendEvent() - Passed event data is invalid.");
      return Promise.reject("Passed event data is invalid.");
    }

    const sendEvent = Event.builder(
      EdgeConstants.Event.Name.SEND_EVENT,
      EventType.EDGE,
      EventSource.REQUEST_CONTENT,
      eventData
    ).build();

    getEventDispatcher().dispatch(sendEvent);

    return new Promise((resolve) => {
      EdgeCallbackManager.getInstance().registerCallback(
        sendEvent.uuid,
        (eventHandles: Array<EventData>) => {
          Log.verbose(
            LOG_EXTENSION,
            LOG_TAG,
            `sendEvent() - Received event handles: ${eventHandles}`
          );
          resolve(eventHandles.map((eventHandle) => eventHandle.getData()));
        }
      );
    });
  }

  async getExperienceCloudId(): Promise<string | null> {
    // Get experience cloud id
    Log.verbose(LOG_EXTENSION, LOG_TAG, "getExperienceCloudId() - Getting Experience Cloud ID");

    const identityResponse = getEventDispatcher().dispatchWithResponse(
      Event.builder(
        EdgeConstants.Event.Name.GET_IDENTITY_ECID,
        EventType.EDGE_IDENTITY,
        EventSource.REQUEST_IDENTITY
      ).build()
    );

    return identityResponse
      .then((responseEvent) => {
        const ecid = responseEvent.data?.getString(EdgeConstants.EventData.Keys.ECID) ?? null;

        Log.verbose(
          LOG_EXTENSION,
          LOG_TAG,
          `getExperienceCloudId() - Received identity response with ECID: ${ecid}`
        );

        return Promise.resolve(ecid);
      })
      .catch((error) => {
        Log.error(
          LOG_EXTENSION,
          LOG_TAG,
          `getExperienceCloudId() - Error while getting ECID: ${error}`
        );

        return Promise.resolve(null);
      });
  }

  setConsent(data: Record<string, unknown>): void {
    // Set consent
    Log.verbose(
      LOG_EXTENSION,
      LOG_TAG,
      `setConsent() - Setting Consent with data: ${safeStringify(data, null, 2)}`
    );

    const eventData = EventData.buildFrom(data);

    if (!eventData) {
      Log.error(LOG_EXTENSION, LOG_TAG, "setConsent() - Passed consent data is invalid.");
      return;
    }

    getEventDispatcher().dispatch(
      Event.builder(
        EdgeConstants.Event.Name.SET_CONSENT,
        EventType.CONSENT,
        EventSource.SET_CONSENT,
        eventData
      ).build()
    );
  }
}

function clearEventDataForSendEvent(data: Record<string, unknown>): Record<string, unknown> {
  // remove any keys that are not allowed
  const allowedKeys = ["xdm", "data", "query"];

  Object.keys(data).forEach((key) => {
    if (!allowedKeys.includes(key)) {
      Log.verbose(
        LOG_EXTENSION,
        LOG_TAG,
        `clearEventDataForSendEvent() - Removing invalid key: (${key})`
      );
      delete data[key];
    }
  });

  return data;
}

export const edge: Edge = new EdgeAPI();
