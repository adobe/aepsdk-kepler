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
import { EventDispatcherInternal } from "../../../src/core/eventhub/EventDispatchers";
import { EventHubInternal } from "../../../src/core/eventhub/EventHubInternal";
import { Event } from "../../../src/core/eventhub/Event";

describe("EventDispatcherInternal", () => {
  let dispatcher: EventDispatcherInternal;
  let eventHub: EventHubInternal;

  beforeEach(() => {
    dispatcher = new EventDispatcherInternal();
    eventHub = new EventHubInternal();
    dispatcher.setEventHub(eventHub);
    eventHub.start();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("dispatch() - should dispatch an event", () => {
    const event = Event.builder("name", "type", "source").build();
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");

    dispatcher.dispatch(event);

    expect(dispatchSpy).toHaveBeenCalledWith(event);
  });

  test("dispatch() -  should not dispatch event if EventHub is not set", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const setSpy = jest.spyOn(dispatcher["pendingResponses"], "set");

    dispatcher = new EventDispatcherInternal();

    const event = Event.builder("name1", "type1", "source1").build();
    dispatcher.dispatch(event);
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  test("dispatch() -  should not dispatch event if EventHub is not started", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const setSpy = jest.spyOn(dispatcher["pendingResponses"], "set");

    dispatcher = new EventDispatcherInternal();
    eventHub = new EventHubInternal();
    dispatcher.setEventHub(eventHub);

    const event = Event.builder("name1", "type1", "source1").build();
    dispatcher.dispatch(event);
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(setSpy).not.toHaveBeenCalled();
  });

  test("dispatchWithResponse() - should be resolved", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const deleteSpy = jest.spyOn(dispatcher["pendingResponses"], "delete");

    const triggerEvent = Event.builder("name1", "type1", "source1").build();
    const responseEvent = Event.builder("name2", "type2", "source2")
      .setResponseId(triggerEvent.uuid)
      .build();
    eventHub.dispatchEvent(responseEvent);
    setTimeout(() => {
      eventHub.dispatchEvent(responseEvent);
    }, 10);
    await expect(dispatcher.dispatchWithResponse(triggerEvent, 1000)).resolves.toEqual(
      responseEvent
    );
    expect(dispatchSpy).toHaveBeenCalledWith(triggerEvent);
    expect(deleteSpy).toHaveBeenCalledWith(triggerEvent.uuid);
  });

  test("dispatchWithResponse() -  should be rejected on timeout", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const deleteSpy = jest.spyOn(dispatcher["pendingResponses"], "delete");

    const triggerEvent = Event.builder("name1", "type1", "source1").build();
    const responseEvent = Event.builder("name2", "type2", "source2")
      .setResponseId(triggerEvent.uuid)
      .build();
    eventHub.dispatchEvent(responseEvent);
    setTimeout(() => {
      eventHub.dispatchEvent(responseEvent);
    }, 200);
    await expect(dispatcher.dispatchWithResponse(triggerEvent, 100)).rejects.toThrow();
    expect(dispatchSpy).toHaveBeenCalledWith(triggerEvent);
    await delay(150);
    expect(deleteSpy).toHaveBeenCalledWith(triggerEvent.uuid);
  });

  test("dispatchWithResponse() -  should be rejected if EventHub is not set", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const setSpy = jest.spyOn(dispatcher["pendingResponses"], "set");

    dispatcher = new EventDispatcherInternal();

    const event = Event.builder("name1", "type1", "source1").build();
    await expect(dispatcher.dispatchWithResponse(event, 100)).rejects.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalledWith(setSpy);
  });

  test("dispatchWithResponse() -   should be rejected if EventHub is not started", async () => {
    const dispatchSpy = jest.spyOn(eventHub, "dispatchEvent");
    const setSpy = jest.spyOn(dispatcher["pendingResponses"], "set");

    dispatcher = new EventDispatcherInternal();
    eventHub = new EventHubInternal();
    dispatcher.setEventHub(eventHub);

    const event = Event.builder("name1", "type1", "source1").build();
    await expect(dispatcher.dispatchWithResponse(event, 100)).rejects.toThrow();
    expect(dispatchSpy).not.toHaveBeenCalledWith(setSpy);
  });
});

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
