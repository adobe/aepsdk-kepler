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
import { assertEdgeHandles, assertRequestUrl } from "../src/test-utils/assertUtil";
import { assertFirstEdgeRequest, assertConsecutiveEdgeRequest, assertEdgeResponse, assertFirstConsentRequest, assertEdgeErrorResponse, assertConsecutiveConsentRequest
 } from "../src/test-utils/edgeUtil";
import { getTestConsentData, getTestSendEvent } from "../src/test-utils/testData";
import { expectedEdgeResponseHandlesForFirstRequest, expectedEdgeResponseHandlesForConsecutiveRequest, expectedConsentResponseHandlesForFirstRequest, expectedConsentResponseHandlesForConsecutiveRequest } from "../src/test-utils/testData";
import { LogLevel } from "@adobe/kepler-aepcore/src/core/services/Logging";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdkConfiguration = require('../configuration.json');

const expectedLocationHint = "or2";

describe("Edge Extension Public API Tests", () => {
    const WAIT_TIME_MS = 1000;
    let originalFetch: typeof global.fetch;
    const recordedResponsesFromFetchSpy: Array<Response> = [];

    const testSendEvent = getTestSendEvent("testSendEvent");
    const testSendEvent2 = getTestSendEvent("testSendEvent2");
    const testSendEvent3 = getTestSendEvent("testSendEvent3");
    const testSendEvent4 = getTestSendEvent("testSendEvent4");
    const testSendEvent5 = getTestSendEvent("testSendEvent5");

    const testSendEventWithDatastreamIdOverride = getTestSendEvent("testSendEventWithDatastreamIdOverride", sdkConfiguration, true);

    const testSendEventWithDatastreamConfigOverride = getTestSendEvent("testSendEventWithDatastreamConfigOverride", sdkConfiguration, false, true);

    beforeEach(() => {
        // Save the original fetch to restore it after tests
        originalFetch = global.fetch;
        // Mock the fetch function using jest.spyOn
        jest.spyOn(global, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
            const response = await originalFetch(input, init); // Make real request

            // Add response clone to the recorded responses as the response is supposed to be
            recordedResponsesFromFetchSpy.push(response.clone());
            return response;
        });

        resetSDK();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        // Clear the recorded responses
        recordedResponsesFromFetchSpy.length = 0;
    });

    function initializeSDK(datastreamId: string, defaultConsent: string = sdkConfiguration["consent.default"]) {
        return AEPSDK.initialize({
            config: {
                "edge.configId": datastreamId,
                "consent.default": defaultConsent
            },
            // Uncomment to see verbose logs for debugging
            logLevel: LogLevel.DEBUG,
        });
    }

    describe("Edge tests", () => {
        test("sendEvent() should send event to Edge Network", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            await initializeSDK(sdkConfiguration["edge.configId"]);

            AEPSDK.sendEvent(testSendEvent);

            // Wait for the event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];

            // Validate that the correct URL, method, and headers are used
            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/interact", expectedDatastreamId);
            assertFirstEdgeRequest(fetchArgs[1], testSendEvent);
            await assertEdgeResponse(response, expectedEdgeResponseHandlesForFirstRequest);
        });

        test("sendEvent() should send event to Edge Network with datastreamIdOverride", async () => {
            const originalDataStreamIdForOverride = sdkConfiguration["edge.configId"];
            const expectedDatastreamId = sdkConfiguration["datastreamIdOverride"];

            await initializeSDK(originalDataStreamIdForOverride);

            AEPSDK.sendEvent(testSendEventWithDatastreamIdOverride);

            // Wait for the event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];

            // Validate that the correct URL, method, and headers are used
            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/interact", expectedDatastreamId);
            assertFirstEdgeRequest(fetchArgs[1], testSendEventWithDatastreamIdOverride, originalDataStreamIdForOverride);
            await assertEdgeResponse(response, expectedEdgeResponseHandlesForFirstRequest);
        });

        test("sendEvent() should send event to Edge Network with datastreamConfigOverride", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            await initializeSDK(expectedDatastreamId);

            AEPSDK.sendEvent(testSendEventWithDatastreamConfigOverride);

            // Wait for the event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];

            // Validate that the correct URL, method, and headers are used
            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/interact", expectedDatastreamId);
            assertFirstEdgeRequest(fetchArgs[1], testSendEventWithDatastreamConfigOverride, {
                configOverrides: {
                    "com_adobe_experience_platform": {
                        "datasets": {
                            "event": {
                                "datasetId": sdkConfiguration["datasetIdOverride"]
                            }
                        }
                    }
                }
            });
            await assertEdgeResponse(response, expectedEdgeResponseHandlesForFirstRequest);
        });

        test("sendEvent() should fail when invalid datastreamId is provided", async () => {
            const expectedDatastreamId = sdkConfiguration["invalidDatastreamId"];
            await initializeSDK(expectedDatastreamId);

            AEPSDK.sendEvent(testSendEvent);

            // Wait for the event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];


            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/interact", expectedDatastreamId);
            assertFirstEdgeRequest(fetchArgs[1], testSendEvent);
            await assertEdgeErrorResponse(response, {status: 400, statusText: "Bad Request", title: "Invalid datastream ID"});
        });

        test("sendEventWithResponse() should send event to Edge Network", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"]);

            const responseHandles = await AEPSDK.sendEventWithResponse(testSendEvent);
            expect(responseHandles).toBeDefined();
            assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
        });

        test("sendEventWithResponse() should send event to Edge Network with datastreamIdOverride", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"]);

            const responseHandles = await AEPSDK.sendEventWithResponse(testSendEventWithDatastreamIdOverride);
            expect(responseHandles).toBeDefined();
            assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
        });

        test("sendEventWithResponse() should send event to Edge Network with datastreamConfigOverride", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"]);

            const responseHandles = await AEPSDK.sendEventWithResponse(testSendEventWithDatastreamConfigOverride);
            expect(responseHandles).toBeDefined();
            assertEdgeHandles(['identity:result', 'locationHint:result', 'state:store'], responseHandles);
        });

        test("sendEventWithResponse() should throw error if invalid datastreamId is provided", async () => {
            await initializeSDK(sdkConfiguration["invalidDatastreamId"]);

            await expect(AEPSDK.sendEventWithResponse(testSendEvent))
                .rejects
                .toThrow("Send event with response failed. No event handles received from Edge Network.");
        });
    });

    describe("Consent tests", () => {
        test("setConsent() should send consent to Edge Network", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"]);

            const consentYes = getTestConsentData("y");
            AEPSDK.setConsent(consentYes);

            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(1);

            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];

            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/privacy/set-consent", sdkConfiguration["edge.configId"]);
            assertFirstConsentRequest(fetchArgs[1], consentYes);
            await assertEdgeResponse(response, expectedConsentResponseHandlesForFirstRequest);
        });
    });

    describe("Consent + Edge tests", () => {
        test("Edge hits should not be sent if default consent is pending ('p') until consent is set to yes('y')", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"], sdkConfiguration["pendingConsent"]);

            AEPSDK.sendEvent(testSendEvent);
            AEPSDK.sendEvent(testSendEvent2);

            // Wait for the event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(0);

            const setConsentYes = getTestConsentData("y");
            AEPSDK.setConsent(setConsentYes);

            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(3);

            // consent request 1
            const fetchArgs1 = (global.fetch as jest.Mock).mock.calls[0];
            const response1 = recordedResponsesFromFetchSpy[0];
            assertRequestUrl(new URL(fetchArgs1[0]), "edge.adobedc.net", "/ee/v1/privacy/set-consent", sdkConfiguration["edge.configId"]);
            assertFirstConsentRequest(fetchArgs1[1], setConsentYes);
            assertEdgeResponse(response1, expectedConsentResponseHandlesForFirstRequest);

            // edge request 1
            const fetchArgs2 = (global.fetch as jest.Mock).mock.calls[1];
            const response2 = recordedResponsesFromFetchSpy[1];
            assertRequestUrl(new URL(fetchArgs2[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs2[1], testSendEvent);
            assertEdgeResponse(response2, expectedEdgeResponseHandlesForConsecutiveRequest);

            // consent request 2
            const fetchArgs3 = (global.fetch as jest.Mock).mock.calls[2];
            const response3 = recordedResponsesFromFetchSpy[2];
            assertRequestUrl(new URL(fetchArgs3[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs3[1], testSendEvent2);
            assertEdgeResponse(response3, expectedEdgeResponseHandlesForConsecutiveRequest);
        });

        test("When consent is updated from 'p' to 'n', all the queued edge hits should be dropped", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"], sdkConfiguration["pendingConsent"]);

            AEPSDK.sendEvent(testSendEvent);
            AEPSDK.sendEvent(testSendEvent2);

            const setConsentNo = getTestConsentData("n");
            AEPSDK.setConsent(setConsentNo);

            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(1);

            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const response = recordedResponsesFromFetchSpy[0];

            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/privacy/set-consent", sdkConfiguration["edge.configId"]);
            assertFirstConsentRequest(fetchArgs[1], setConsentNo);
            await assertEdgeResponse(response, expectedConsentResponseHandlesForFirstRequest);
        });

        test("Consent is updated from 'p' to 'y' all the queued edge hits should be sent, and when consent is updated from 'y' to 'n', all the subsequent edge hits should be dropped", async () => {
            await initializeSDK(sdkConfiguration["edge.configId"], sdkConfiguration["pendingConsent"]);

            AEPSDK.sendEvent(testSendEvent);
            AEPSDK.sendEvent(testSendEvent2);

            const consentYes = getTestConsentData("y");
            AEPSDK.setConsent(consentYes);
            AEPSDK.sendEvent(testSendEvent3);
            AEPSDK.sendEvent(testSendEvent4);

            const consentNo = getTestConsentData("n");
            AEPSDK.setConsent(consentNo);
            AEPSDK.sendEvent(testSendEvent5);

            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(6);

            // request 1 - consent (out of order since default collect consent is 'p')
            const fetchArgs1 = (global.fetch as jest.Mock).mock.calls[0];
            const response1 = recordedResponsesFromFetchSpy[0];
            assertRequestUrl(new URL(fetchArgs1[0]), "edge.adobedc.net", "/ee/v1/privacy/set-consent", sdkConfiguration["edge.configId"]);
            assertFirstConsentRequest(fetchArgs1[1], consentYes);
            await assertEdgeResponse(response1, expectedConsentResponseHandlesForFirstRequest);

            // request 2 - edge (in order)
            const fetchArgs2 = (global.fetch as jest.Mock).mock.calls[1];
            const response2 = recordedResponsesFromFetchSpy[1];
            assertRequestUrl(new URL(fetchArgs2[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs2[1], testSendEvent);
            assertEdgeResponse(response2, expectedEdgeResponseHandlesForConsecutiveRequest);

            // request 3 - edge (in order)
            const fetchArgs3 = (global.fetch as jest.Mock).mock.calls[2];
            const response3 = recordedResponsesFromFetchSpy[2];
            assertRequestUrl(new URL(fetchArgs3[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs3[1], testSendEvent2);
            assertEdgeResponse(response3, expectedEdgeResponseHandlesForConsecutiveRequest);


            // request 4 - edge (in order) (testSendEvent3)
            const fetchArgs4 = (global.fetch as jest.Mock).mock.calls[3];
            const response4 = recordedResponsesFromFetchSpy[3];
            assertRequestUrl(new URL(fetchArgs4[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs4[1], testSendEvent3);
            assertEdgeResponse(response4, expectedEdgeResponseHandlesForConsecutiveRequest);

            // request 5 - edge (in order) (testSendEvent4)
            const fetchArgs5 = (global.fetch as jest.Mock).mock.calls[4];
            const response5 = recordedResponsesFromFetchSpy[4];
            assertRequestUrl(new URL(fetchArgs5[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/interact`, sdkConfiguration["edge.configId"]);
            assertConsecutiveEdgeRequest(fetchArgs5[1], testSendEvent4);
            assertEdgeResponse(response5, expectedEdgeResponseHandlesForConsecutiveRequest);


            // request 6 - consent (in order)
            const fetchArgs6 = (global.fetch as jest.Mock).mock.calls[5];
            const response6 = recordedResponsesFromFetchSpy[5];
            assertRequestUrl(new URL(fetchArgs6[0]), "edge.adobedc.net", `/ee/${expectedLocationHint}/v1/privacy/set-consent`, sdkConfiguration["edge.configId"]);
            assertConsecutiveConsentRequest(fetchArgs6[1], consentNo);
            assertEdgeResponse(response6, expectedConsentResponseHandlesForConsecutiveRequest);
        })
    });
});
