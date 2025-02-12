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

    async function initializeSDK(datastreamId: string) {
        await AEPSDK.initialize({
            config: {
                "edge.configId": datastreamId
            },
            logLevel: LogLevel.VERBOSE,
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


})
