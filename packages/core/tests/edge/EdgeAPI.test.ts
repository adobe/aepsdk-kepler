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

import { EdgeAPI } from "../../src/edge";
import { getEventDispatcher } from "../../src/Core";
import { Event, EventData } from "../../src/core/eventhub";
import {
  EdgeCallback,
  EdgeCallbackManager,
  EdgeEventHandles,
} from "../../src/edge/EdgeCallbackManager";

jest.mock("../../src/Core");

describe("EdgeAPI tests", () => {
  let mockEventDispatcher: {
    dispatch: jest.Mock;
    dispatchWithResponse: jest.Mock;
  };

  beforeEach(() => {
    mockEventDispatcher = {
      dispatch: jest.fn(),
      dispatchWithResponse: jest.fn(),
    };
    (getEventDispatcher as jest.Mock).mockReturnValue(mockEventDispatcher);

    jest.useFakeTimers({ doNotFake: ["performance"] });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("EdgeAPI should be defined", () => {
    const edge = new EdgeAPI();
    expect(edge).toBeDefined();
  });

  test("sendEvent API - without valid xdm data should not dispatch an event", () => {
    const invalidXDMData = [
      {},
      { xdm: "" },
      { xdm: null },
      { xdm: undefined },
      { xdm: 1 },
      { xdm: false },
      { xdm: 2.3 },
      { xdm: [] },
      { xdm: {} },
    ];
    const edge = new EdgeAPI();

    for (const data of invalidXDMData) {
      edge.sendEvent(data);
      expect(getEventDispatcher).toHaveBeenCalledTimes(0);
    }
  });

  test("sendEvent API - with xdm data should dispatch an event", () => {
    const edge = new EdgeAPI();
    const sendEventData = {
      xdm: {
        key: "value",
      },
    };
    edge.sendEvent(sendEventData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AEP Send Event Request",
        type: "com.adobe.eventType.edge",
        source: "com.adobe.eventSource.requestContent",
        data: EventData.buildFrom(sendEventData),
        _parentId: null,
        _responseId: null,
        uuid: expect.any(String),
        sequentialId: expect.any(Number),
      })
    );
  });

  test("sendEvent API - with data containing with invalid fields should not dispatch an event with sanitized data containing allowed fields", () => {
    const edge = new EdgeAPI();
    const sendEventData = {
      xdm: {
        // valid field
        key: "value",
      },
      data: {
        // valid field
        key: "value",
      },
      query: {
        // valid field
        key: "value",
      },
      customData: {
        // invalid field
        key: "value",
      },
      Key: "value", // invalid field
    };
    edge.sendEvent(sendEventData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AEP Send Event Request",
        type: "com.adobe.eventType.edge",
        source: "com.adobe.eventSource.requestContent",
        data: EventData.buildFrom({
          xdm: {
            key: "value",
          },
          data: {
            key: "value",
          },
          query: {
            key: "value",
          },
        }),
        _parentId: null,
        _responseId: null,
        uuid: expect.any(String),
        sequentialId: expect.any(Number),
      })
    );
  });

  test("sendEventWithResponse API - without valid xdm data should not dispatch an event", async () => {
    const invalidXDMData = [
      {},
      { xdm: "" },
      { xdm: null },
      { xdm: undefined },
      { xdm: 1 },
      { xdm: false },
      { xdm: 2.3 },
      { xdm: [] },
      { xdm: {} },
    ];

    const edge = new EdgeAPI();
    for (const data of invalidXDMData) {
      const response = await edge.sendEventWithResponse(data).catch((error) => {
        return error;
      });
      expect(response).toEqual("Passed event data should contain valid XDM data.");
    }

    expect(getEventDispatcher).toHaveBeenCalledTimes(0);
  });

  test("sendEventWithResponse API - should dispatch an event and register callback with CallbackManager", async () => {
    const mockEdgeHandlesResponseEventData: EdgeEventHandles = [
      EventData.buildFrom({
        payload: {
          key1: "value",
        },
        type: "EdgeHandle1",
      })!,
      EventData.buildFrom({
        payload: {
          key2: "value",
        },
        type: "EdgeHandle2",
      })!,
    ];

    jest
      .spyOn(EdgeCallbackManager.getInstance(), "registerCallback")
      .mockImplementation((requestId: string, callback: EdgeCallback) => {
        expect(requestId).toBeDefined();
        expect(callback).toBeDefined();

        callback(mockEdgeHandlesResponseEventData);
      });
    const edge = new EdgeAPI();
    const sendEventData = {
      xdm: {
        key: "value",
      },
    };
    const response = await edge.sendEventWithResponse(sendEventData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(response).toBeDefined();
    expect(response.length).toEqual(2);
    expect(response).toEqual(
      mockEdgeHandlesResponseEventData.map((eventHandle) => eventHandle.getData())
    );
  });

  test("getExperienceCloudId API - should dispatch the get Identity ECID request with response", async () => {
    jest
      .spyOn(mockEventDispatcher, "dispatchWithResponse")
      .mockImplementation((triggerEvent: Event, timeout?: number): Promise<Event> => {
        expect(timeout).toBeUndefined();
        expect(triggerEvent).toBeDefined();

        const fakeResponseEvent = Event.builder(
          "AEP Identity ECID Response",
          "com.adobe.eventType.edgeIdentity",
          "com.adobe.eventSource.responseIdentity",
          EventData.buildFrom({
            ecid: "ECID_123_abc",
          })
        )
          .setResponseId(triggerEvent.uuid)
          .build();
        return Promise.resolve(fakeResponseEvent);
      });

    const edge = new EdgeAPI();
    const response = await edge.getExperienceCloudId();

    expect(response).toEqual("ECID_123_abc");
    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
  });

  test("getExperienceCloudId API - should return null if response does not contain ECID", async () => {
    jest
      .spyOn(mockEventDispatcher, "dispatchWithResponse")
      .mockImplementation((triggerEvent: Event, timeout?: number): Promise<Event> => {
        expect(timeout).toBeUndefined();
        expect(triggerEvent).toBeDefined();

        const fakeResponseEvent = Event.builder(
          "AEP Identity ECID Response",
          "com.adobe.eventType.edgeIdentity",
          "com.adobe.eventSource.responseIdentity",
          EventData.buildFrom({
            key: "value",
          })
        )
          .setResponseId(triggerEvent.uuid)
          .build();
        return Promise.resolve(fakeResponseEvent);
      });

    const edge = new EdgeAPI();
    const response = await edge.getExperienceCloudId();

    expect(response).toBeNull();
    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
  });

  test("getExperienceCloudId API - should return null if response is not received before api timeout", async () => {
    jest
      .spyOn(mockEventDispatcher, "dispatchWithResponse")
      .mockImplementation((triggerEvent: Event, timeout?: number): Promise<Event> => {
        expect(timeout).toBeUndefined();
        expect(triggerEvent).toBeDefined();

        // mock API timeout
        return new Promise((resolve, reject) => {
          reject("API Timed out waiting for response");
        });
      });

    const edge = new EdgeAPI();
    const response = await edge.getExperienceCloudId();

    expect(response).toBeNull();
    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
  });

  test("setConsent API - should dispatch an event with consent data", async () => {
    const edge = new EdgeAPI();
    const consentData = {
      key: "value",
    };
    edge.setConsent(consentData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "AEP Set Consent Request",
        type: "com.adobe.eventType.edgeConsent",
        source: "com.adobe.eventSource.setConsent",
        data: EventData.buildFrom(consentData),
        _parentId: null,
        _responseId: null,
        uuid: expect.any(String),
        sequentialId: expect.any(Number),
      })
    );
  });
});
