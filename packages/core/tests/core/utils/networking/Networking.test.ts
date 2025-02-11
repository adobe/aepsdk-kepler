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

import { asyncRequest, HttpMethod, NetworkRequest } from "../../../../src/core/utils/networking";
describe("test asyncRequest", () => {
  Object.defineProperty(global, "performance", {
    writable: true,
  });

  beforeAll(() => {
    jest.spyOn(global, "fetch");
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
    jest.spyOn(global, "clearTimeout");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return ERROR_CONNECTION for non-HTTPS URL", async () => {
    const request: NetworkRequest = {
      url: "http://example.com",
      method: HttpMethod.GET,
      headers: {},
      body: null,
      timeout: 1000,
    };

    const result = await asyncRequest(request);

    expect(result).toEqual({
      responseCode: -1,
    });
  });

  it("should return ERROR_CONNECTION for invalid HTTPS URL", async () => {
    const invalidUrls = [
      // no protocol
      "example.com",
      // no https protocol
      "http://example.com",
      // no valid domain
      "https://",
      "https://example/invalid",
    ];

    invalidUrls.forEach(async (url) => {
      const request: NetworkRequest = {
        url: url,
        method: HttpMethod.GET,
        headers: {},
        timeout: 1000,
      };

      const result = await asyncRequest(request);

      try {
        expect(result.responseCode).toEqual(-1);
      } catch (error) {
        throw new Error(
          `Error: URL:(${url}) should return ERROR_CONNECTION but returned:(${result}). Error:(${error})`
        );
      }
    });
  });

  it("should merge headers correctly", async () => {
    const request: NetworkRequest = {
      url: "https://example.com",
      method: HttpMethod.GET,
      headers: { "Custom-Header": "value" },
      timeout: 1000,
    };

    const mockResponse = {
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: jest.fn().mockResolvedValue('{"key":"value"}'),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await asyncRequest(request);

    expect(fetch).toHaveBeenCalledWith("https://example.com", {
      method: HttpMethod.GET,
      headers: {
        "Accept-Language": "en-US",
        "Custom-Header": "value",
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: undefined,
      signal: expect.any(Object),
    });
    expect(result.responseCode).toBe(200);
    expect(result.headers!["content-type"]).toBe("application/json");
    expect(result.bodyAsText).toBe('{"key":"value"}');
  });

  it("should send a request and return a successful response", async () => {
    const request: NetworkRequest = {
      url: "https://example.com",
      method: HttpMethod.GET,
      timeout: 1000,
    };

    const mockResponse = {
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      text: jest.fn().mockResolvedValue('{"key":"value"}'),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

    const result = await asyncRequest(request);

    expect(fetch).toHaveBeenCalledWith("https://example.com", {
      method: HttpMethod.GET,
      headers: {
        "Accept-Language": "en-US",
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: undefined,
      signal: expect.any(Object),
    });
    expect(result.responseCode).toBe(200);
    expect(result.headers!["content-type"]).toBe("application/json");
    expect(result.bodyAsText).toBe('{"key":"value"}');
  });

  it("should handle fetch errors gracefully", async () => {
    const request: NetworkRequest = {
      url: "https://example.com",
      method: HttpMethod.GET,
      headers: {},
      body: null,
      timeout: 1000,
    };

    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const result = await asyncRequest(request);

    expect(result).toEqual({
      responseCode: -1,
    });
  });

  it("should set timeout number correctly", async () => {
    const request: NetworkRequest = {
      url: "https://example.com",
      method: HttpMethod.GET,
      headers: {},
      body: null,
      timeout: 100,
    };

    await asyncRequest(request);

    expect(setTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(clearTimeout).toHaveBeenCalledTimes(1);
  });
});
