/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { EdgeHit } from "../../../src/edge/EdgeHit";
import { getURLForHit } from "../../../src/edge/network-handling/UrlHelper";

describe("URLHelper Tests", () => {
  describe("getURLForHit", () => {
    test("should return the correct URL for a hit when the custom domain is provided", () => {
      const hit = EdgeHit.builder("test-request-id", {}, 1234567890).build();
      const url = getURLForHit("test-datastream-id", hit, "mycompany.adobedc.net");
      expect(url).toBe(
        "https://mycompany.adobedc.net/ee/v1/interact?configId=test-datastream-id&requestId=test-request-id"
      );
    });

    test("should return the correct URL for a hit when the custom domain is not provided", () => {
      const hit = EdgeHit.builder("test-request-id", {}, 1234567890).build();
      const url = getURLForHit("test-datastream-id", hit, null);
      expect(url).toBe(
        "https://edge.adobedc.net/ee/v1/interact?configId=test-datastream-id&requestId=test-request-id"
      );
    });

    test("should return the correct URL for a hit when location hint is provided", () => {
      const hit = EdgeHit.builder("test-request-id", {}, 1234567890).build();
      const url = getURLForHit("test-datastream-id", hit, null, "test-location-hint");
      expect(url).toBe(
        "https://edge.adobedc.net/ee/test-location-hint/v1/interact?configId=test-datastream-id&requestId=test-request-id"
      );
    });

    test("should return the correct URL for a hit when the custom domain is provided and location hint is provided", () => {
      const hit = EdgeHit.builder("test-request-id", {}, 1234567890).build();
      const url = getURLForHit(
        "test-datastream-id",
        hit,
        "mycompany.adobedc.net",
        "test-location-hint"
      );
      expect(url).toBe(
        "https://mycompany.adobedc.net/ee/test-location-hint/v1/interact?configId=test-datastream-id&requestId=test-request-id"
      );
    });
  });
});
