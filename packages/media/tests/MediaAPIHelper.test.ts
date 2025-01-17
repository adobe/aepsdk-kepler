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
      "media.sessionEnd",
      "media.adBreakStart",
      "media.adBreakEnd",
      "media.adStart",
      "media.adEnd",
      "media.adProgress",
      "media.bufferStart",
      "media.bufferEnd",
      "media.bitrateChange",
      "media.error",
      "media.complete",
      "media.seekStart",
      "media.seekEnd",
      "media.pause",
      "media.play",
      "media.trackStart",
      "media.trackComplete",
      "media.trackSkip",
      "media.trackError",
      "media.segmentStart",
      "media.segmentEnd",
      "media.segmentSkip",
      "media.segmentError",
      "media.bitrateChange",
      "media.bitrateChange",
    ];

    validMediaEvents.forEach((eventType) => {
      expect(isValidMediaEvent(eventType)).toBe(true);
    });
  });
});
