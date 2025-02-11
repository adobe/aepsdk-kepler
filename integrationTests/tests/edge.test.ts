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

jest.mock("@adobe/kepler-aepcore/src/platform-kepler");
import { AEPSDK } from "@adobe/kepler-aepcore";
import { resetSDK } from "../src/test-utils/resetSDK";
import { assertEdgeHandles } from "../src/test-utils/assertUtil";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdkConfiguration = require('../configuration.json');

describe("test Edge public APIs", () => {
    const WAIT_TIME_MS = 1000;
    let originalFetch: typeof global.fetch;

    const testImplementationDetails = {
        "environment": "app",
        "name": "https://ns.adobe.com/experience/mobilesdk/kepler",
        "version": "1.0.0-beta.1"
    }
    const testFetchECIDQuery = {
        "identity": {
            "fetch": [
                "ECID",
            ],
        },
    }

    const testSendEvent = {
        "xdm": {
            "eventType": "KeplerIntegrationTest::testSendEvent",
            "timestamp": 123456789
        },
        "data": {
            "key": "value"
        }
    }

    const testSendEventWithDatastreamIdOverride = {
        "xdm": {
            "eventType": "KeplerIntegrationTest::testSendEventWithDatastreamIdOverride",
            "timestamp": 123456789
        },
        "data": {
            "key": "value"
        },
        "config": {
            "datastreamIdOverride": sdkConfiguration["datastreamIdOverride"]
        }
    }

    const testSendEventWithDatastreamConfigOverride = {
        "xdm": {
            "eventType": "KeplerIntegrationTest::testSendEventWithDatastreamConfigOverride",
            "timestamp": 123456789
        },
        "data": {
            "key": "value"
        },
        "config": {
            "datastreamConfigOverride": sdkConfiguration["datastreamConfigOverride"]
        }
    }

    beforeEach(() => {
        // Save the original fetch to restore it after tests
        originalFetch = global.fetch;
        // Mock the fetch function using jest.spyOn
        jest.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            return originalFetch(input, init);
        });

        resetSDK();
    });

    afterEach(() => {
        // Clean up the mock after each test
        jest.clearAllMocks();
        jest.resetAllMocks();
        jest.restoreAllMocks();
    });

    test("sendEvent() should send event to Edge Network", async () => {
        const expectedDatastreamId = sdkConfiguration["edge.configId"];

        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        AEPSDK.sendEvent(testSendEvent);

        // Wait for the event to be sent
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

        // Assert that the fetch function was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Get the arguments from the first call to fetch
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
        //console.log("Captured Fetch Arguments:", fetchArgs);

        // Validate that the correct URL, method, and headers are used
        const url = new URL(fetchArgs[0]);
        const requestId = url.searchParams.get('requestId');
        const configId = url.searchParams.get('configId');

        expect(url.hostname).toEqual("edge.adobedc.net");
        expect(url.pathname).toEqual("/ee/v1/interact");
        expect(configId).toEqual(expectedDatastreamId);
        expect(requestId).toBeDefined();

        expect(fetchArgs[1].method).toBe("POST");
        expect(fetchArgs[1].headers).toHaveProperty("Content-Type", "application/json");

        // Validate the body (subset of data in the body)
        const bodyData = JSON.parse(fetchArgs[1].body);
        expect(bodyData).toEqual(expect.objectContaining({
            "events": [
                {
                    "xdm": {
                        "eventType": "KeplerIntegrationTest::testSendEvent",
                        "timestamp": expect.any(String)
                    },
                    "data": {
                        "key": "value"
                    }
                }

            ],
            "query":testFetchECIDQuery,
            "xdm": {
                "implementationDetails": testImplementationDetails
            }
        }));

        // Allow the real fetch to be called
        const response = await originalFetch(fetchArgs[0], fetchArgs[1]);
        const jsonResponse = await response.json();

        // Assert the actual response (you can adjust this based on the real response)
        //console.log("Response Data:", jsonResponse);

        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");
        expect(jsonResponse).toBeDefined();
        expect(jsonResponse.requestId).toBeDefined();
        const responseHandles = jsonResponse.handle;

        expect(responseHandles).toBeDefined();
        assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEvent() should send event to Edge Network with datastreamIdOverride", async () => {
        const expectedDatastreamId = sdkConfiguration["datastreamIdOverride"];

        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        AEPSDK.sendEvent(testSendEventWithDatastreamIdOverride);

        // Wait for the event to be sent
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

        // Assert that the fetch function was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Get the arguments from the first call to fetch
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
        //console.log("Captured Fetch Arguments:", fetchArgs);

        // Validate that the correct URL, method, and headers are used
        const url = new URL(fetchArgs[0]);
        const requestId = url.searchParams.get('requestId');
        const configId = url.searchParams.get('configId');

        expect(url.hostname).toEqual("edge.adobedc.net");
        expect(url.pathname).toEqual("/ee/v1/interact");
        expect(configId).toEqual(expectedDatastreamId);
        expect(requestId).toBeDefined();

        expect(fetchArgs[1].method).toBe("POST");
        expect(fetchArgs[1].headers).toHaveProperty("Content-Type", "application/json");

        // Validate the body (subset of data in the body)
        const bodyData = JSON.parse(fetchArgs[1].body);
        expect(bodyData).toEqual({
            "events": [
                {
                    "xdm": {
                        "eventType": "KeplerIntegrationTest::testSendEventWithDatastreamIdOverride",
                        "timestamp": expect.any(String)
                    },
                    "data": {
                        "key": "value"
                    }
                }

            ],
            "meta": {
                "sdkConfig": {
                    "datastream" :{
                        "original": sdkConfiguration["edge.configId"],
                    }
                }
            },
            "query":testFetchECIDQuery,
            "xdm": {
                "implementationDetails": testImplementationDetails
            }
        });

         // Allow the real fetch to be called
         const response = await originalFetch(fetchArgs[0], fetchArgs[1]);
         const jsonResponse = await response.json();

         // Assert the actual response (you can adjust this based on the real response)
         expect(response.status).toBe(200);
         expect(response.statusText).toBe("OK");
         expect(jsonResponse).toBeDefined();
         expect(jsonResponse.requestId).toBeDefined();
         const responseHandles = jsonResponse.handle;

         expect(responseHandles).toBeDefined();
         assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEvent() should send event to Edge Network with datastreamConfigOverride", async () => {
        const expectedDatastreamId = sdkConfiguration["edge.configId"];

        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        AEPSDK.sendEvent(testSendEventWithDatastreamConfigOverride);

        // Wait for the event to be sent
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

        // Assert that the fetch function was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Get the arguments from the first call to fetch
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];

        // Validate that the correct URL, method, and headers are used
        const url = new URL(fetchArgs[0]);
        const requestId = url.searchParams.get('requestId');
        const configId = url.searchParams.get('configId');

        expect(url.hostname).toEqual("edge.adobedc.net");
        expect(url.pathname).toEqual("/ee/v1/interact");
        expect(configId).toEqual(expectedDatastreamId);
        expect(requestId).toBeDefined();

        expect(fetchArgs[1].method).toBe("POST");
        expect(fetchArgs[1].headers).toHaveProperty("Content-Type", "application/json");

        // Validate the body (subset of data in the body)
        const bodyData = JSON.parse(fetchArgs[1].body);
        expect(bodyData).toEqual({
            "events": [
                {
                    "xdm": {
                        "eventType": "KeplerIntegrationTest::testSendEventWithDatastreamConfigOverride",
                        "timestamp": expect.any(String)
                    },
                    "data": {
                        "key": "value"
                    }
                }
            ],
            "meta": {
                "configOverrides": {
                    "com_adobe_experience_platform": {
                        "datasets": {
                            "event": {
                                "datasetId": sdkConfiguration["datasetIdOverride"]
                            }
                        }
                    },
                }
            },
            "query":testFetchECIDQuery,
            "xdm": {
                "implementationDetails": testImplementationDetails
            }
        });

        // Allow the real fetch to be called
        const response = await originalFetch(fetchArgs[0], fetchArgs[1]);
        const jsonResponse = await response.json();

        // Assert the actual response (you can adjust this based on the real response)
        expect(response.status).toBe(200);
        expect(response.statusText).toBe("OK");
        expect(jsonResponse).toBeDefined();
        expect(jsonResponse.requestId).toBeDefined();
        const responseHandles = jsonResponse.handle;

        expect(responseHandles).toBeDefined();
        assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEvent() should fail when invalid datastreamId is provided", async () => {
        const expectedDatastreamId = sdkConfiguration["invalidDatastreamId"];
        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["invalidDatastreamId"]
            }
        });

        AEPSDK.sendEvent(testSendEvent);

        // Wait for the event to be sent
        await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

        // Assert that the fetch function was called
        expect(global.fetch).toHaveBeenCalledTimes(1);

        // Get the arguments from the first call to fetch
        const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];

        // Validate that the correct URL, method, and headers are used
        const url = new URL(fetchArgs[0]);
        const requestId = url.searchParams.get('requestId');
        const configId = url.searchParams.get('configId');

        expect(url.hostname).toEqual("edge.adobedc.net");
        expect(url.pathname).toEqual("/ee/v1/interact");
        expect(configId).toEqual(expectedDatastreamId);
        expect(requestId).toBeDefined();

        expect(fetchArgs[1].method).toBe("POST");
        expect(fetchArgs[1].headers).toHaveProperty("Content-Type", "application/json");

        // Validate the body (subset of data in the body)
        const bodyData = JSON.parse(fetchArgs[1].body);
        expect(bodyData).toEqual(expect.objectContaining({
            "events": [
                {
                    "xdm": {
                        "eventType": "KeplerIntegrationTest::testSendEvent",
                        "timestamp": expect.any(String)
                    },
                    "data": {
                        "key": "value"
                    }
                }

            ],
            "query":testFetchECIDQuery,
            "xdm": {
                "implementationDetails": testImplementationDetails
            }
        }));

        // Allow the real fetch to be called
        const response = await originalFetch(fetchArgs[0], fetchArgs[1]);
        const jsonResponse = await response.json();

        expect(response.status).toBe(400);
        expect(response.statusText).toBe("Bad Request");
        expect(jsonResponse).toBeDefined();
        expect(jsonResponse.title).toContain("Invalid datastream ID");
    });

    test("sendEventWithResponse() should send event to Edge Network", async () => {
        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        const responseHandles = await AEPSDK.sendEventWithResponse(testSendEvent);
        expect(responseHandles).toBeDefined();
        assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEventWithResponse() should send event to Edge Network with datastreamIdOverride", async () => {
        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        const responseHandles = await AEPSDK.sendEventWithResponse(testSendEventWithDatastreamIdOverride);
        expect(responseHandles).toBeDefined();
        assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEventWithResponse() should send event to Edge Network with datastreamConfigOverride", async () => {
        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["edge.configId"]
            }
        });

        const responseHandles = await AEPSDK.sendEventWithResponse(testSendEventWithDatastreamConfigOverride);
        expect(responseHandles).toBeDefined();
        assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
    });

    test("sendEventWithResponse() should throw error if invalid datastreamId is provided", async () => {
        AEPSDK.initialize({
            config: {
                "edge.configId": sdkConfiguration["invalidDatastreamId"]
            }
        });

        await expect(AEPSDK.sendEventWithResponse(testSendEvent))
            .rejects
            .toThrow("Send event with response failed. No event handles received from Edge Network.");
    });
});
