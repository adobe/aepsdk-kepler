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
import { createExtensionContainer, SharedStateResolver } from "../../../src/core/extension";
import {
  Event,
  EventHub,
  EventListener,
  EventSource,
  EventType,
  EventData,
} from "../../../src/core/eventhub";
import { SharedStateManager, SharedStateStatus } from "../../../src/core/sharedstate";
describe("test ConfigurationExtension class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("test ExtensionContainer.dispatch()", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const event = new Event("name", "type", "source");
    const container = createExtensionContainer(eventHub, "test", new SharedStateManager());
    container.dispatch(event);

    expect(eventHub.dispatchEvent).toBeCalledTimes(1);
    expect(eventHub.dispatchEvent).toBeCalledWith(event);
  });

  test("test ExtensionContainer.registerEventListener()", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const container = createExtensionContainer(eventHub, "test", new SharedStateManager());
    const listener: EventListener = jest.fn();
    container.registerEventListener("type", "source", listener);

    expect(eventHub.on).toBeCalledTimes(1);
    expect(eventHub.on).toBeCalledWith("type", "source", listener);
  });

  test("test ExtensionContainer.createXDMSharedState() - null event", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.updateSharedState = jest.fn();

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);
    const state = EventData.buildFrom({}) as EventData;
    container.createXDMSharedState(state, null);

    expect(sharedStateManager.updateSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.updateSharedState).toBeCalledWith(
      "extension_name",
      0,
      state,
      SharedStateStatus.SET
    );

    expect(eventHub.dispatchEvent).toBeCalledTimes(1);

    const event = (eventHub.dispatchEvent as any).mock.calls[0][0] as Event;
    expect(event.type).toBe(EventType.HUB);
    expect(event.source).toBe(EventSource.SHARED_STATE);
  });

  test("test ExtensionContainer.createXDMSharedState()", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.updateSharedState = jest.fn();

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);

    const eventId = 101;
    const e = new Event("name", "type", "source");
    e.id = eventId;
    const state = EventData.buildFrom({}) as EventData;
    container.createXDMSharedState(state, e);

    expect(sharedStateManager.updateSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.updateSharedState).toBeCalledWith(
      "extension_name",
      eventId,
      state,
      SharedStateStatus.SET
    );

    expect(eventHub.dispatchEvent).toBeCalledTimes(1);

    const event = (eventHub.dispatchEvent as any).mock.calls[0][0] as Event;
    expect(event.type).toBe(EventType.HUB);
    expect(event.source).toBe(EventSource.SHARED_STATE);
  });

  test("test ExtensionContainer.getXDMSharedState() - null event", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.getSharedState = jest.fn();

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);
    container.getXDMSharedState("extension_name", null);

    expect(sharedStateManager.getSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.getSharedState).toBeCalledWith("extension_name", 0);
  });

  test("test ExtensionContainer.getXDMSharedState()", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.getSharedState = jest.fn();

    const eventId = 99;
    const event = new Event("name", "type", "source");
    event.id = eventId;

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);
    container.getXDMSharedState("extension_name", event);

    expect(sharedStateManager.getSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.getSharedState).toBeCalledWith("extension_name", eventId);
  });

  test("test ExtensionContainer.createPendingXDMSharedState()", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.updateSharedState = jest.fn();

    const eventId = 99;
    const e = new Event("name", "type", "source");
    e.id = eventId;

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);
    const promise: Promise<SharedStateResolver> = container.createPendingXDMSharedState(e);

    expect(sharedStateManager.updateSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.updateSharedState).toBeCalledWith(
      "extension_name",
      eventId,
      null,
      SharedStateStatus.PENDING
    );

    expect(eventHub.dispatchEvent).toBeCalledTimes(0);

    const sharedState = EventData.buildFrom({ key: "value" }) as EventData;
    promise
      .then((resolver) => {
        resolver(sharedState);
      })
      .then(() => {
        expect(sharedStateManager.updateSharedState).toBeCalledTimes(2);
        expect(sharedStateManager.updateSharedState).lastCalledWith(
          "extension_name",
          eventId,
          sharedState,
          SharedStateStatus.SET
        );

        expect(eventHub.dispatchEvent).toBeCalledTimes(1);

        const event = (eventHub.dispatchEvent as any).mock.calls[0][0] as Event;
        expect(event.type).toBe(EventType.HUB);
        expect(event.source).toBe(EventSource.SHARED_STATE);
      });
  });

  test("test ExtensionContainer.createPendingXDMSharedState() - null state", () => {
    const eventHub: EventHub = {
      on: jest.fn(),
      dispatchEvent: jest.fn(),
      start: jest.fn(),
      registerEventProcessor: jest.fn(),
    };

    const sharedStateManager = new SharedStateManager();
    sharedStateManager.updateSharedState = jest.fn();
    sharedStateManager.removeSharedState = jest.fn();

    const eventId = 99;
    const e = new Event("name", "type", "source");
    e.id = eventId;

    const container = createExtensionContainer(eventHub, "extension_name", sharedStateManager);
    const promise: Promise<SharedStateResolver> = container.createPendingXDMSharedState(e);

    expect(sharedStateManager.updateSharedState).toBeCalledTimes(1);
    expect(sharedStateManager.updateSharedState).toBeCalledWith(
      "extension_name",
      eventId,
      null,
      SharedStateStatus.PENDING
    );

    expect(eventHub.dispatchEvent).toBeCalledTimes(0);

    const sharedState = new Map();
    sharedState.set("key", "value");

    promise
      .then((resolver) => {
        resolver(null);
      })
      .then(() => {
        expect(sharedStateManager.removeSharedState).toBeCalledTimes(1);
        expect(sharedStateManager.removeSharedState).toBeCalledWith("extension_name", eventId);

        expect(eventHub.dispatchEvent).toBeCalledTimes(1);

        const event = (eventHub.dispatchEvent as any).mock.calls[0][0] as Event;
        expect(event.type).toBe(EventType.HUB);
        expect(event.source).toBe(EventSource.SHARED_STATE);
      });
  });
});
