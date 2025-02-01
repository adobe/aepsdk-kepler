/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Media } from "../src/";
import { getEventDispatcher } from "@adobe/kepler-aepcore/dist/Core";
import { EventData } from "@adobe/kepler-aepcore/dist/core/eventhub";

jest.mock("@adobe/kepler-aepcore/dist/Core");

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

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("MediaAPI should be defined", () => {
    expect(Media).toBeDefined();
  });

  test("createMediaSession API - without valid xdm data should not dispatch an event", () => {
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

    for (const data of invalidXDMData) {
      Media.createMediaSession(data);
      expect(getEventDispatcher).toHaveBeenCalledTimes(0);
    }
  });

  test("createMediaSession API - with valid xdm data but without valid eventType should not dispatch an event", () => {
    const xdmWithInvalidEventType = [
      { xdm: { eventType: "" } },
      { xdm: { eventType: null } },
      { xdm: { eventType: undefined } },
      { xdm: { eventType: 1 } },
      { xdm: { eventType: false } },
      { xdm: { eventType: 2.3 } },
      { xdm: { eventType: [] } },
      { xdm: { eventType: {} } },
    ];

    for (const data of xdmWithInvalidEventType) {
      Media.createMediaSession(data);
      expect(getEventDispatcher).toHaveBeenCalledTimes(0);
    }
  });

  test("createMediaSession API - with valid xdm data should dispatch an event", () => {
    const sendEventData = {
      xdm: {
        eventType: "media.sessionStart",
        key: "value",
      },
    };
    Media.createMediaSession(sendEventData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);

    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "createMediaSession",
        type: "com.adobe.eventType.edgeMedia",
        source: "com.adobe.eventSource.createSession",
        data: EventData.buildFrom({
          sessionId: "default",
          xdm: {
            eventType: "media.sessionStart",
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

  test("sendMediaEvent API - without valid xdm data should not dispatch an event", () => {
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

    for (const data of invalidXDMData) {
      Media.sendMediaEvent(data);
      expect(getEventDispatcher).toHaveBeenCalledTimes(0);
    }
  });

  test("sendMediaEvent API - with valid xdm data but without valid eventType should not dispatch an event", () => {
    const xdmWithInvalidEventType = [
      { xdm: { eventType: "" } },
      { xdm: { eventType: null } },
      { xdm: { eventType: undefined } },
      { xdm: { eventType: 1 } },
      { xdm: { eventType: false } },
      { xdm: { eventType: 2.3 } },
      { xdm: { eventType: [] } },
      { xdm: { eventType: {} } },
    ];

    for (const data of xdmWithInvalidEventType) {
      Media.sendMediaEvent(data);
      expect(getEventDispatcher).toHaveBeenCalledTimes(0);
    }
  });

  test("sendMediaEvent API - with valid xdm data should dispatch an event", () => {
    const sendEventData = {
      xdm: {
        eventType: "media.play",
        key: "value",
      },
    };
    Media.sendMediaEvent(sendEventData);

    expect(getEventDispatcher).toHaveBeenCalledTimes(1);
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledTimes(1);

    //dispatched event should have the correct event data including the sessionId automatically added by the API
    expect(mockEventDispatcher.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "sendMediaEvent",
        type: "com.adobe.eventType.edgeMedia",
        source: "com.adobe.eventSource.requestContent",
        data: EventData.buildFrom({
          sessionId: "default",
          xdm: {
            eventType: "media.play",
            key: "value",
          },
        }),
        _parentId: null,
        _responseId: null,
        uuid: expect.any(String),
        sequentialId: expect.any(Number),
      })
    );

    // TODO: discuss the format of the dispatched event
    // data.data.*
    // expect(dispatchedEvent.data.data.xdm.eventType).toBe("media.play");
    // expect(dispatchedEvent.data.data.sessionId).toBe("default");
  });
});
