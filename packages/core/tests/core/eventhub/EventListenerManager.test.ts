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

import { Event } from "../../../src/core/eventhub";
import { EventListenerManager } from "../../../src/core/eventhub/EventListenerManager";

describe("test EventListenerManager class", () => {
  test("EventListenerManager instance should be created", () => {
    const eventListenerManager = new EventListenerManager();
    expect(eventListenerManager).toBeInstanceOf(EventListenerManager);
  });

  test("addEventListener should add event listener", () => {
    const eventListenerManager = new EventListenerManager();
    const eventType = "eventType";
    const eventSource = "eventSource";
    const eventListener = jest.fn();
    eventListenerManager.addEventListener(eventType, eventSource, eventListener);

    const listenerMap = eventListenerManager.getEventListenerMap();
    const key = "eventType:eventSource";
    expect(listenerMap.has(key)).toBeTruthy();
  });

  test("addResponseListener should add response listener", () => {
    const eventListenerManager = new EventListenerManager();
    const eventType = "eventType";
    const eventSource = "eventSource";

    const testEvent = new Event("test", eventType, eventSource, null, "parentID");
    const eventListener = jest.fn();
    eventListenerManager.addOneTimeResponseListener(
      testEvent,
      eventType,
      eventSource,
      eventListener
    );

    const listenerMap = eventListenerManager.getOneTimeListenerMap();
    const key = `${testEvent.uuid}:eventType:eventSource`;
    expect(listenerMap.has(key)).toBeTruthy();
  });

  test("process should trigger event listeners if preset and match for the event being processed", () => {
    const eventListenerManager = new EventListenerManager();
    const eventType = "eventType";
    const eventSource = "eventSource";

    const testEvent = new Event("TriggerRequestEvent", eventType, eventSource, null, "parentID");

    const eventListener = jest.fn();

    eventListenerManager.addEventListener(eventType, eventSource, eventListener);

    eventListenerManager.processListeners(testEvent);
    expect(eventListener).toBeCalled();

    // verify that the listener is not removed after being called
    const eventListenerMap = eventListenerManager.getEventListenerMap();
    expect(eventListenerMap.size).toEqual(1);
  });

  test("process should trigger one time listener if there is a match.", () => {
    const eventListenerManager = new EventListenerManager();
    const eventType = "eventType";
    const eventSource = "eventSource";

    const testEvent = new Event("TriggerRequestEvent1", eventType, eventSource, null, "parentID1");
    const testEvent2 = new Event("TriggerRequestEvent2", eventType, eventSource, null, "parentID2");

    const eventWaitingForResponseUUID_1 = testEvent.uuid;
    const eventWaitingForResponseUUID_2 = testEvent2.uuid;

    const oneTimeResponseListener = jest.fn();
    const oneTimeResponseListener2 = jest.fn();

    const reponseEventType = "responseEventType";
    const responseEventSource = "responseEventSource";

    eventListenerManager.addOneTimeResponseListener(
      testEvent,
      reponseEventType,
      responseEventSource,
      oneTimeResponseListener
    );

    eventListenerManager.addOneTimeResponseListener(
      testEvent2,
      reponseEventType,
      responseEventSource,
      oneTimeResponseListener2
    );

    let oneTimeListenerMap = eventListenerManager.getOneTimeListenerMap();
    expect(oneTimeListenerMap.size).toEqual(2);

    // response event will have the uuid of the waiting event as the parentId
    const testResponseEvent = new Event(
      "ResponseEvent",
      reponseEventType,
      responseEventSource,
      null,
      eventWaitingForResponseUUID_1
    );

    const testResponseEvent2 = new Event(
      "ResponseEvent",
      reponseEventType,
      responseEventSource,
      null,
      eventWaitingForResponseUUID_2
    );

    eventListenerManager.processListeners(testResponseEvent);
    expect(oneTimeResponseListener).toBeCalled();

    eventListenerManager.processListeners(testResponseEvent2);
    expect(oneTimeResponseListener2).toBeCalled();
    // verify that the listener is removed after being called
    oneTimeListenerMap = eventListenerManager.getOneTimeListenerMap();
    expect(oneTimeListenerMap.size).toEqual(0);
  });
});
