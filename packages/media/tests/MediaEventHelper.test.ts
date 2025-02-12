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

import { EventData } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { MediaConstants } from "../src/MediaConstants";
import { getEventType, getEventData, getEventDataWithoutSessionId } from "../src/MediaEventHelper";
import { Event, EventType } from "@adobe/kepler-aepcore/dist/core/eventhub";

describe("MediaEventHelper tests", () => {
  test("getEventType() - should return the event type", () => {
    const eventData = EventData.buildFrom({
      xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
    });
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      eventData
    ).build();
    expect(getEventType(event)).toBe("media.sessionStart");
  });

  test("getEventType() - should return null if the event type is not present", () => {
    const eventData = EventData.buildFrom({ xdm: { key: "value", key1: 1 } });
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      eventData
    ).build();
    expect(getEventType(event)).toBe(null);
  });

  test("getEventType() - should return null if the event data is not present", () => {
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      null
    ).build();
    expect(getEventType(event)).toBe(null);
  });

  test("getEventData() - should return the event data", () => {
    const eventData = EventData.buildFrom({
      xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
    });
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      eventData
    ).build();
    expect(getEventData(event)).toEqual({
      xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
    });
  });

  test("getEventData() - should return null if the event data is not present", () => {
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      null
    ).build();
    expect(getEventData(event)).toBeNull();
  });

  test("getEventDataWithoutSessionId() - should return the event data without the session ID", () => {
    const eventData = EventData.buildFrom({
      clientSessionId: "testSessionId",
      xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
    });
    const event = Event.builder(
      "testEvent",
      EventType.MEDIA,
      MediaConstants.Media.EVENT_SOURCE_CREATE_SESSION,
      eventData
    ).build();

    expect(getEventDataWithoutSessionId(event)).toEqual({
      xdm: { eventType: "media.sessionStart", key: "value", key1: 1 },
    });
  });
});
