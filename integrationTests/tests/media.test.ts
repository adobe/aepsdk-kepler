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

jest.mock("@adobe/kepler-aepcore/src/platform-kepler");

import { AEPSDK } from "@adobe/kepler-aepcore";
import { resetSDK } from "../src/test-utils/resetSDK";
import { LogLevel } from '@adobe/kepler-aepcore/src/core/services';
import { Media } from "@adobe/kepler-aepmedia";
import {
    assertRequestUrl
} from "../src/test-utils/assertUtil";
import {
    assertMediaEventRequest,
    assertMediaEventResponse,
    assertMediaSessionStartResponse,
    assertSessionStartRequest,
} from "../src/test-utils/mediaUtil";
import { expectedConsentResponseHandlesForConsecutiveRequest, expectedConsentResponseHandlesForFirstRequest, getTestConsentData } from "../src/test-utils/testData";
import { assertConsecutiveConsentRequest, assertEdgeResponse, assertFirstConsentRequest } from "../src/test-utils/edgeUtil";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sdkConfiguration = require('../configuration.json');

describe("Media Public APIs", () => {
    const WAIT_TIME_MS = 1000;
    let originalFetch: typeof global.fetch;
    const recordedResponsesFromFetchSpy: Array<Response> = [];

    const playEvent = {
        "xdm": {
            "eventType": "media.play",
            "mediaCollection": {
                "playhead": 1,
            }
        }
    }

    const pauseEvent = {
        "xdm": {
            "eventType": "media.pauseStart",
            "mediaCollection": {
                "playhead": 5,
            }
        }
    }

    const sessionStartEvent = {
        "xdm": {
            "eventType": "media.sessionStart",
            "mediaCollection": {
                "playhead": 0,
                "sessionDetails": {
                    "streamType": "video",
                    "friendlyName": "KeplerIntegrationTest::test_media_name",
                    "hasResume": false,
                    "name": "KeplerIntegrationTest::test_media_id",
                    "length": 100,
                    "contentType": "vod",
                    "channel": "KeplerIntegrationTest::test_channel",
                    "playerName": "KeplerIntegrationTest::test_player_name"
                }
            }
        }
    }

    const sessionEndEvent = {
        "xdm": {
            "eventType": "media.sessionEnd",
            "mediaCollection": {
                "playhead": 9,
            }
        }
    }

    const sessionCompleteEvent = {
        "xdm": {
            "eventType": "media.sessionComplete",
            "mediaCollection": {
                "playhead": 10,
            }
        }
    }
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

    async function initializeSDK(datastreamId: string, defaultConsent: string = sdkConfiguration["consent.default"]) {
        await AEPSDK.initialize({
            config: {
                "edge.configId": datastreamId,
                "consent.default": defaultConsent
            },
            logLevel: LogLevel.DEBUG,
            extensions: [
                Media.EXTENSION
            ]
        });
    }

    describe("Basic Scenarios", () => {
        test("sessionStart, play, pause, sessionComplete", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            // Initialize the SDK
            await initializeSDK(expectedDatastreamId);

            /**
             * Create a media session
             */
            Media.createMediaSession(sessionStartEvent);

            // Wait for the session start hit to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const sessionStartResponse = recordedResponsesFromFetchSpy[0]; // Get the actual response

            // Validate that the correct URL, method, and headers are used
            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/va/v1/sessionStart", expectedDatastreamId);
            assertSessionStartRequest(fetchArgs[1], sessionStartEvent);

            // Assert the session start response
            const backendMediaSessionId = await assertMediaSessionStartResponse(sessionStartResponse);

            /**
             * Send a play event
             */
            Media.sendMediaEvent(playEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(2);
            const fetchArgsForPlay = (global.fetch as jest.Mock).mock.calls[1];
            const playResponse = recordedResponsesFromFetchSpy[1];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForPlay[0]), "edge.adobedc.net", "/ee/or2/va/v1/play", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForPlay[1], playEvent, backendMediaSessionId!);

            // Assert the actual response
            assertMediaEventResponse(playResponse);

            /*
            * Send a pause event
            */
            Media.sendMediaEvent(pauseEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(3);
            const fetchArgsForPause = (global.fetch as jest.Mock).mock.calls[2];
            const pauseResponse = recordedResponsesFromFetchSpy[2];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForPause[0]), "edge.adobedc.net", "/ee/or2/va/v1/pauseStart", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForPause[1], pauseEvent, backendMediaSessionId!);

            // Assert the actual response
            assertMediaEventResponse(pauseResponse);

            /*
            * Send a session complete event
            */
            Media.sendMediaEvent(sessionCompleteEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(4);
            const fetchArgsForSessionComplete = (global.fetch as jest.Mock).mock.calls[3];
            const sessionCompleteResponse = recordedResponsesFromFetchSpy[3];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForSessionComplete[0]), "edge.adobedc.net", "/ee/or2/va/v1/sessionComplete", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForSessionComplete[1], sessionCompleteEvent, backendMediaSessionId!);

                // Assert the actual response
                assertMediaEventResponse(sessionCompleteResponse);
        });

        test("sessionStart, play, pause, sessionEnd", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            // Initialize the SDK
            await initializeSDK(expectedDatastreamId);

            /**
             * Create a media session
             */
            Media.createMediaSession(sessionStartEvent);

            // Wait for the session start hit to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            // Assert that the fetch function was called
            expect(global.fetch).toHaveBeenCalledTimes(1);

            // Get the arguments from the first call to fetch
            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const sessionStartResponse = recordedResponsesFromFetchSpy[0];

            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/va/v1/sessionStart", expectedDatastreamId);
            // Assert the session start response
            const backendMediaSessionId = await assertMediaSessionStartResponse(sessionStartResponse);

            /**
             * Send a play event
             */
            Media.sendMediaEvent(playEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(2);
            const fetchArgsForPlay = (global.fetch as jest.Mock).mock.calls[1];
            const playResponse = recordedResponsesFromFetchSpy[1];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForPlay[0]), "edge.adobedc.net", "/ee/or2/va/v1/play", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForPlay[1], playEvent, backendMediaSessionId!);

            // Assert the actual response
            assertMediaEventResponse(playResponse);

            /**
             * Send a pause event
             */
            Media.sendMediaEvent(pauseEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(3);
            const fetchArgsForPause = (global.fetch as jest.Mock).mock.calls[2];
            const pauseResponse = recordedResponsesFromFetchSpy[2];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForPause[0]), "edge.adobedc.net", "/ee/or2/va/v1/pauseStart", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForPause[1], pauseEvent, backendMediaSessionId!);

            // Assert the actual response
            assertMediaEventResponse(pauseResponse);

            /**
             * Send a session end event
             */
            Media.sendMediaEvent(sessionEndEvent);

            // Wait for the media event to be sent
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(4);
            const fetchArgsForSessionEnd = (global.fetch as jest.Mock).mock.calls[3];
            const sessionEndResponse = recordedResponsesFromFetchSpy[3];

            // Assert the request url and body
            assertRequestUrl(new URL(fetchArgsForSessionEnd[0]), "edge.adobedc.net", "/ee/or2/va/v1/sessionEnd", expectedDatastreamId);
            assertMediaEventRequest(fetchArgsForSessionEnd[1], sessionEndEvent, backendMediaSessionId!);

            // Assert the actual response
            assertMediaEventResponse(sessionEndResponse);
        });
    });


    describe("Media + Consent", () => {
        test("When consent set to 'n', Media session should not be initiated and no media events should be sent", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            await initializeSDK(expectedDatastreamId, sdkConfiguration["pendingConsent"]);

            const consentNo = getTestConsentData("n");
            AEPSDK.setConsent(consentNo);

            Media.createMediaSession(sessionStartEvent);
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            Media.sendMediaEvent(playEvent);
            Media.sendMediaEvent(pauseEvent);
            Media.sendMediaEvent(sessionCompleteEvent);
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(1);

            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];

            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/v1/privacy/set-consent", expectedDatastreamId);
            assertFirstConsentRequest(fetchArgs[1], consentNo);
            await assertEdgeResponse(recordedResponsesFromFetchSpy[0], expectedConsentResponseHandlesForFirstRequest);
        });

        test("When consent set to 'n', and there is an existing session, it should be ended", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            await initializeSDK(expectedDatastreamId);

            Media.createMediaSession(sessionStartEvent);
            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            Media.sendMediaEvent(playEvent);

            const consentNo = getTestConsentData("n");
            AEPSDK.setConsent(consentNo);
            Media.sendMediaEvent(pauseEvent);
            Media.sendMediaEvent(sessionEndEvent);

            await new Promise(resolve => setTimeout(resolve, WAIT_TIME_MS));

            expect(global.fetch).toHaveBeenCalledTimes(3);

            const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
            const sessionStartResponse = recordedResponsesFromFetchSpy[0];

            assertRequestUrl(new URL(fetchArgs[0]), "edge.adobedc.net", "/ee/va/v1/sessionStart", expectedDatastreamId);
            assertMediaSessionStartResponse(sessionStartResponse);

            const fetchArgs2 = (global.fetch as jest.Mock).mock.calls[1];
           const playResponse = recordedResponsesFromFetchSpy[1];

            assertRequestUrl(new URL(fetchArgs2[0]), "edge.adobedc.net", "/ee/or2/va/v1/play", expectedDatastreamId);
            assertMediaEventResponse(playResponse);

            const fetchArgs3 = (global.fetch as jest.Mock).mock.calls[2];
            const consentResponse = recordedResponsesFromFetchSpy[2];

            assertRequestUrl(new URL(fetchArgs3[0]), "edge.adobedc.net", "/ee/or2/v1/privacy/set-consent", sdkConfiguration["edge.configId"]);
            assertConsecutiveConsentRequest(fetchArgs3[1], consentNo);
            await assertEdgeResponse(consentResponse, expectedConsentResponseHandlesForConsecutiveRequest);
        });

        test("Media session is allowed to be created if consent is update to 'y' from 'n'", async () => {
            const expectedDatastreamId = sdkConfiguration["edge.configId"];

            await initializeSDK(expectedDatastreamId);


        })
    });
})
