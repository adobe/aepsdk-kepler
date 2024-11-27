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

import { EventListener } from "../../../src/core/eventhub/EventListenerManager";

describe("test EventListener class", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  test("EventListener instance should be created", () => {
    const eventListener = new EventListener("eventType", "eventSource", jest.fn());
    expect(eventListener).toBeInstanceOf(EventListener);
  });

  test("eventListener object should return set properties", () => {
    const eventType = "eventType";
    const eventSource = "eventSource";
    const oneTime = true;
    const timestamp = Date.now();
    const timeout = 1000;

    const eventListener = new EventListener(
      eventType,
      "eventSource",
      jest.fn(),
      oneTime,
      timestamp,
      timeout
    );

    expect(eventListener.getEventType()).toEqual(eventType);
    expect(eventListener.getEventSource()).toEqual(eventSource);
    expect(eventListener.getCallback()).toBeDefined();
    expect(eventListener.isOneTime()).toEqual(oneTime);
    expect(eventListener.getTimestamp()).toBeGreaterThan(Date.now() - 10); // 10ms buffer
    expect(eventListener.getTimestamp()).toBeLessThanOrEqual(timestamp);
    expect(eventListener.getTimeout()).toEqual(timeout);
    expect(eventListener.isExpired()).toEqual(false);

    jest.advanceTimersByTime(1001);
    expect(eventListener.isExpired()).toEqual(true);
  });

  test("eventListener object should return set properties with default values if not set", () => {
    const eventType = "eventType";
    const eventSource = "eventSource";
    const eventListener = new EventListener(eventType, "eventSource", jest.fn());

    expect(eventListener.getEventType()).toEqual(eventType);
    expect(eventListener.getEventSource()).toEqual(eventSource);
    expect(eventListener.getCallback()).toBeDefined();
    expect(eventListener.isOneTime()).toEqual(false);
    expect(eventListener.getTimestamp()).toBeGreaterThan(Date.now() - 10); // 10ms buffer
    expect(eventListener.getTimestamp()).toBeLessThanOrEqual(Date.now());
    expect(eventListener.getTimeout()).toEqual(-1);
    expect(eventListener.isExpired()).toEqual(false);
  });
});
