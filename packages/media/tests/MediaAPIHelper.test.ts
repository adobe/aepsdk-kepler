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
import { isValidMediaXDMData, isValidMediaEvent } from "../src/MediaAPIHelper";

describe("test MediaAPIHelper class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("isValidMediaXDMData() - should return false if the input is not a valid media XDM data", () => {
    const eventData = EventData.buildFrom({});

    expect(isValidMediaXDMData(eventData)).toBe(false);
  });

  test("isValidMediaEvent() - should return false if the input is not a valid media event", () => {
    const invalidEventType = ["", null, "sessionStart", "play"];

    invalidEventType.forEach((eventType) => {
      expect(isValidMediaEvent(eventType)).toBe(false);
    });
  });

  test("isValidMediaEvent() - should return true if the input is a valid media event", () => {
    const validMediaEvents = [
      "media.sessionStart",
      "media.play",
      "media.ping",
      "media.bitrateChange",
      "media.bufferStart",
      "media.pauseStart",
      "media.adBreakStart",
      "media.adStart",
      "media.adComplete",
      "media.adSkip",
      "media.adBreakComplete",
      "media.chapterStart",
      "media.chapterComplete",
      "media.chapterSkip",
      "media.error",
      "media.statesUpdate",
      "media.sessionEnd",
      "media.sessionComplete",
    ];

    validMediaEvents.forEach((eventType) => {
      try {
        expect(isValidMediaEvent(eventType)).toBe(true);
      } catch (error) {
        throw new Error(
          `Expected event type "${eventType}" to be valid, but it was not. Error: ${error}`
        );
      }
    });
  });
});
