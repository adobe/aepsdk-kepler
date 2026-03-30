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

import { getDataObject } from "@adobe/vega-aepcore/src/core/utils/DataObjectUtil";
import { DataObject } from "@adobe/vega-aepcore/src/core/eventhub/EventData";
import { isNullOrEmptyString } from "@adobe/vega-aepcore/src/core/utils/StringUtil";
import { testFetchECIDQuery, testImplementationDetails, testIdentityMap } from "./testData";
/*
******************************************************
* Assert Utils
******************************************************
*/


export function assertSessionStartRequest(request: RequestInit, actualMediaData: DataObject) {
    expect(request.method).toBe("POST");
    expect(request.headers).toHaveProperty("Content-Type", "application/json");

    try {
        const body = JSON.parse(request.body as string);
        const expectedSessionStartData = actualMediaData;
        const xdmData = getDataObject(expectedSessionStartData, "xdm") ?? {};
        xdmData.timestamp = expect.any(String);

        expect(body).toEqual(expect.objectContaining({
            "events": [
                expectedSessionStartData
            ],
            "xdm": {
                "implementationDetails": testImplementationDetails
            },
            "query": testFetchECIDQuery
        }));
    } catch (error) {
        throw new Error(`Failed to parse request body. ${error}`);
    }
}

export function assertMediaEventRequest(request: RequestInit, actualMediaData: DataObject, expectedSessionId: string | null) {
    expect(request.method).toBe("POST");
    expect(request.headers).toHaveProperty("Content-Type", "application/json");

    try {
        const body = JSON.parse(request.body as string);
        const expectedMediaData = actualMediaData;
        const xdmData = getDataObject(expectedMediaData, "xdm") ?? {};

        // append the timestamp to the xdmData
        xdmData.timestamp = expect.any(String);

        const mediaCollectionData = getDataObject(xdmData, "mediaCollection") ?? {};
        // append the sessionId to the mediaCollectionData
        mediaCollectionData.sessionID = expectedSessionId ?? expect.any(String);

        expect(body).toEqual(expect.objectContaining({
            "events": [expectedMediaData],
            "xdm": {
                "implementationDetails": testImplementationDetails,
                "identityMap": expect.objectContaining(testIdentityMap)
            },
            "meta": expect.any(Object)
        }));
    } catch (error) {
        throw new Error(`Failed to parse request body. ${error}`);
    }
}

export function assertMediaEventResponse(response: Response) {
    expect(response.status).toBe(204);
    expect(response.statusText).toBe("No Content");
    expect(response.text()).resolves.toBe("");
}

export async function assertMediaSessionStartResponse(response: Response): Promise<string | undefined> {

    const clonedResponse = response.clone();

    expect(clonedResponse.status).toBe(200);
    expect(clonedResponse.statusText).toBe("OK");

    const jsonResponse = await clonedResponse.text();
    const jsonResponseObject = JSON.parse(jsonResponse);
    expect(jsonResponseObject).toBeDefined();
    expect(jsonResponseObject.requestId).toBeDefined();
    expect(jsonResponseObject.handle).toBeDefined();

    const mediaSessionId = getMediaSessionIdFromResponse(jsonResponseObject.handle);
    expect(isNullOrEmptyString(mediaSessionId)).toBeFalsy();

    return mediaSessionId;
}

/*
******************************************************
* Test Utils
******************************************************
*/


export function getMediaSessionIdFromResponse(responseHandles: Array<Record<string, unknown>>): string | undefined {
    const mediaHandle = getHandleOfType('media-analytics:new-session', responseHandles);

    if(!mediaHandle) {
        return undefined;
    }

    console.log("Media handle", JSON.stringify(mediaHandle, null, 2));

    const mediaPayload = getEntryFromPayload(mediaHandle?.payload as Array<Record<string, unknown>>, 0);

    if(!mediaPayload) {
        return undefined;
    }

    const sessionIdFromSessionStartResponse = mediaPayload.sessionId as string;

    console.log("Returned sessionId", sessionIdFromSessionStartResponse);
    return sessionIdFromSessionStartResponse;
}

export function getHandleOfType(type: string, responseHandles: Array<Record<string, unknown>>): Record<string, unknown> | undefined {
    return responseHandles.find(handle => handle.type === type);
}

export function getEntryFromPayload(payload: Array<Record<string, unknown>>, index: number): Record<string, unknown> {
    return payload[index];
}
