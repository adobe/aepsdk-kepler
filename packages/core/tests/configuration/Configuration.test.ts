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
import { ConfigurationExtension } from "../../src/configuration/ConfigurationExtension";
import { Configuration } from "../../src/configuration";
import { Event, createEventHub, EventType, EventSource } from "../../src/core/eventhub";
import { SharedStateManager, SharedStateStatus } from "../../src/core/sharedstate";
import { createExtensionContainer, ExtensionContainer } from "../../src/core/extension";
import { serviceLookup } from "../../src/core/services";
import {
  EXTENSION_NAME,
  EXTENSION_VERSION,
  UPDATE_CONFIGURATION_EVENT_KEY,
  UPDATE_CONFIGURATION_EVENT_NAME,
} from "../../src/configuration/Constants";
import { SHARED_STATE_NAME, SHARED_STATE_KEY_OWNER } from "../../src/core/sharedstate/Constants";
import { EventHub } from "../../src/core/eventhub";

describe("test Configuration extension", () => {
  let configuration: Configuration = new ConfigurationExtension();
  let eventHub = createEventHub();
  let configurationContainer: ExtensionContainer | null = null;
  beforeEach(() => {
    configuration = new ConfigurationExtension();
    eventHub = createEventHub();
    const sharedStateManager = new SharedStateManager();
    configurationContainer = createExtensionContainer(
      eventHub,
      configuration.EXTENSION.name,
      sharedStateManager
    );
    configuration.EXTENSION.onRegister(configurationContainer, serviceLookup);
  });

  it("should return correct extension name & extension version", () => {
    expect(configuration.EXTENSION.name).toEqual(EXTENSION_NAME);
    expect(configuration.EXTENSION.version).toEqual(EXTENSION_VERSION);
  });

  it("updateConfiguration() - should update the configuration state and dispatch shared state event", () => {
    const dispatchedEvents: Event[] = [];
    eventHub.registerEventProcessor((event: Event) => {
      dispatchedEvents.push(event);
      return event;
    });
    eventHub.start();

    configuration.updateConfiguration({ key: "value" });
    expect(dispatchedEvents.length).toBe(2);

    // update configuration event
    expect(dispatchedEvents[0].name).toEqual(UPDATE_CONFIGURATION_EVENT_NAME);
    expect(dispatchedEvents[0].type).toEqual(EventType.CONFIGURATION);
    expect(dispatchedEvents[0].source).toEqual(EventSource.REQUEST_CONTENT);
    expect(dispatchedEvents[0].data?.getDataObject(UPDATE_CONFIGURATION_EVENT_KEY)).toEqual({
      key: "value",
    });

    // configuration shared state
    expect(dispatchedEvents[1].name).toEqual(SHARED_STATE_NAME);
    expect(dispatchedEvents[1].type).toEqual(EventType.HUB);
    expect(dispatchedEvents[1].source).toEqual(EventSource.SHARED_STATE);
    expect(dispatchedEvents[1].data?.getString(SHARED_STATE_KEY_OWNER)).toEqual(EXTENSION_NAME);

    const result = configurationContainer?.getXDMSharedState(EXTENSION_NAME, null);
    expect(result?.value?.getDataObject()).toEqual({ key: "value" });
    expect(result?.status).toEqual(SharedStateStatus.SET);
  });

  it("updateConfiguration() - should combine the new configuration with the existing one.", () => {
    const dispatchedEvents: Event[] = [];
    eventHub.registerEventProcessor((event: Event) => {
      dispatchedEvents.push(event);
      return event;
    });
    eventHub.start();

    // updateConfiguration() #1
    configuration.updateConfiguration({ key1: "value" });
    expect(dispatchedEvents.length).toBe(2);

    // update configuration event
    expect(dispatchedEvents[0].name).toEqual(UPDATE_CONFIGURATION_EVENT_NAME);
    expect(dispatchedEvents[0].type).toEqual(EventType.CONFIGURATION);
    expect(dispatchedEvents[0].source).toEqual(EventSource.REQUEST_CONTENT);
    expect(dispatchedEvents[0].data?.getDataObject(UPDATE_CONFIGURATION_EVENT_KEY)).toEqual({
      key1: "value",
    });

    // configuration shared state
    expect(dispatchedEvents[1].name).toEqual(SHARED_STATE_NAME);
    expect(dispatchedEvents[1].type).toEqual(EventType.HUB);
    expect(dispatchedEvents[1].source).toEqual(EventSource.SHARED_STATE);
    expect(dispatchedEvents[1].data?.getString(SHARED_STATE_KEY_OWNER)).toEqual(EXTENSION_NAME);

    const result1 = configurationContainer?.getXDMSharedState(EXTENSION_NAME, null);
    expect(result1?.value?.getDataObject()).toEqual({ key1: "value" });
    expect(result1?.status).toEqual(SharedStateStatus.SET);

    // updateConfiguration() #2
    dispatchedEvents.length = 0;
    configuration.updateConfiguration({ key1: "newValue", key2: "value" });
    expect(dispatchedEvents.length).toBe(2);

    const result2 = configurationContainer?.getXDMSharedState(
      EXTENSION_NAME,
      buildLatestEvent(eventHub)
    );
    expect(result2?.value?.getDataObject()).toEqual({ key1: "newValue", key2: "value" });
    expect(result2?.status).toEqual(SharedStateStatus.SET);

    // updateConfiguration() #3
    configuration.updateConfiguration({
      key3: "value",
      key4: {
        key41: "value",
      },
    });
    const result3 = configurationContainer?.getXDMSharedState(
      EXTENSION_NAME,
      buildLatestEvent(eventHub)
    );
    expect(result3?.value?.getDataObject()).toEqual({
      key1: "newValue",
      key2: "value",
      key3: "value",
      key4: {
        key41: "value",
      },
    });
    expect(result3?.status).toEqual(SharedStateStatus.SET);

    // updateConfiguration() #4
    configuration.updateConfiguration({
      key4: {
        key41: "newValue",
        key42: "value",
      },
    });
    const result4 = configurationContainer?.getXDMSharedState(
      EXTENSION_NAME,
      buildLatestEvent(eventHub)
    );
    expect(result4?.value?.getDataObject()).toEqual({
      key1: "newValue",
      key2: "value",
      key3: "value",
      key4: {
        key41: "newValue",
        key42: "value",
      },
    });
    expect(result4?.status).toEqual(SharedStateStatus.SET);

    // updateConfiguration() #5
    configuration.updateConfiguration({
      key4: {
        key41: "newValue",
        key42: null,
      },
    });
    const result5 = configurationContainer?.getXDMSharedState(
      EXTENSION_NAME,
      buildLatestEvent(eventHub)
    );
    expect(result5?.value?.getDataObject()).toEqual({
      key1: "newValue",
      key2: "value",
      key3: "value",
      key4: {
        key41: "newValue",
        key42: null,
      },
    });
    expect(result5?.status).toEqual(SharedStateStatus.SET);
  });
});

function buildLatestEvent(eventHub: EventHub): Event {
  const latestEvent = new Event("", "", "", null);
  eventHub.dispatchEvent(latestEvent);
  return latestEvent;
}
