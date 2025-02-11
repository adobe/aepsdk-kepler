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

import { isValidHttpsURL } from "../../../../src/core/utils/networking/UrlUtil";

describe("isValidHttpsURL", () => {
  test("should return true for a valid HTTPS URL", () => {
    const validUrls = [
      "https://www.adobe.com",
      "https://edge.adobedc.net",
      "https://edge.adobedc.net/ee/v1/interact",
      "https://edge.adobedc.net/ee/v1/interact?configId=test-datastream-id&requestId=test-request-id",
      "https://edge.adobedc.net/ee/test-location-hint/v1/interact?configId=test-datastream-id&requestId=test-request-id",
    ];
    validUrls.forEach((url) => {
      try {
        expect(isValidHttpsURL(url)).toBe(true);
      } catch (error) {
        throw new Error(`Error: URL:(${url}) should be valid but is not. Error:(${error})`);
      }
    });
  });

  test("should return false for an invalid URL", () => {
    const invalidUrls = [
      // no domain
      "http://www",
      "https:///ee/v1/interact",
      "https://?configId=test-datastream-id&requestId=test-request-id",
      // not https
      "http://edge.adobedc.net",
      // no https protocol
      "edge.adobedc.net",
      "edge.adobedc.net/ee/v1/interact",
      "edge.adobedc.net/ee/v1/interact?configId=test-datastream-id&requestId=test-request-id",
      "edge.adobedc.net/ee/test-location-hint/v1/interact?configId=test-datastream-id&requestId=test-request-id",
    ];
    invalidUrls.forEach((url) => {
      try {
        expect(isValidHttpsURL(url)).toBe(false);
      } catch (error) {
        throw new Error(`Error:  URL(${url}) should be invalid but is valid. Error:(${error})`);
      }
    });
  });
});
