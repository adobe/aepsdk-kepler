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

import { DataObject } from "@adobe/vega-aepcore/src/core/eventhub/EventData";
import { getDataObject, isEmptyDataObject } from "@adobe/vega-aepcore/src/core/utils/DataObjectUtil";
import { testFetchECIDQuery, testImplementationDetails, testIdentityMap, testSetConsentQuery } from "./testData";
import { assertEdgeHandles } from "./assertUtil";

/*
******************************************************
* Edge Assert Util
******************************************************
*/

function assertBaseEdgeRequest(request: RequestInit, actualEdgeData: DataObject, options?: {
    originalDatastreamId?: string;
    configOverrides?: DataObject;
}) {
    expect(request.method).toBe("POST");
    expect(request.headers).toHaveProperty("Content-Type", "application/json");

    // only add to meta if the payload is not empty
    const expectedMetaPayload = {
        ...(options?.originalDatastreamId ? getMetaPayloadForDatastreamIdPayload(options.originalDatastreamId) : {}),
        ...(options?.configOverrides ? getMetaPayloadForDatastreamConfigOverride(options.configOverrides) : {})
    }

    const body = JSON.parse(request.body as string);


    delete actualEdgeData["config"];
    delete actualEdgeData["request"];

    // Create base expectation without meta first
    const baseExpectation: {
        events: DataObject[];
        xdm: {
            implementationDetails: typeof testImplementationDetails;
            timestamp?: string | typeof expect.any;
        };
        meta?: DataObject;
    } = {
        "events": [actualEdgeData],
        "xdm": {
            "implementationDetails": testImplementationDetails
        }
    };

    // Verify that the timestamp is present in the xdm object
    const xdmData = getDataObject(actualEdgeData, "xdm") ?? {};
    xdmData.timestamp = expect.any(String);

    // Only add meta if there is content
    if (!isEmptyDataObject(expectedMetaPayload)) {
        baseExpectation["meta"] = expectedMetaPayload;
    }

    return { body, baseExpectation };
}

export function assertFirstEdgeRequest(
    request: RequestInit,
    actualEdgeData: DataObject,
    options?: {
        originalDatastreamId?: string;
        configOverrides?: DataObject;
    }
) {
    try {
        const { body, baseExpectation } = assertBaseEdgeRequest(request, actualEdgeData, options);

        expect(body).toEqual(expect.objectContaining({
            ...baseExpectation,
            "query": testFetchECIDQuery
        }));
    } catch (error) {
        throw new Error(`Failed to parse request body. ${error}`);
    }
}

export function assertConsecutiveEdgeRequest(request: RequestInit, actualEdgeData: DataObject, options?: {
    originalDatastreamId?: string;
    configOverrides?: DataObject;
}) {
    const { body, baseExpectation } = assertBaseEdgeRequest(request, actualEdgeData, options);


    expect(body).toEqual(expect.objectContaining({
        ...baseExpectation,
        "xdm": {
            ...baseExpectation.xdm,
            "identityMap": expect.objectContaining(testIdentityMap)
        },
        "meta": {
            ...baseExpectation.meta,
            state: expect.any(Object)
        }
    }));
}

function assertBaseConsentRequest(request: RequestInit, actualConsentData: DataObject) {
    expect(request.method).toBe("POST");
    expect(request.headers).toHaveProperty("Content-Type", "application/json");

    const body = JSON.parse(request.body as string);
    const expectedConsentData = actualConsentData;

    return {
        body,
        baseExpectation: {
            "consent": expectedConsentData.consent,
            "xdm": {
                "implementationDetails": testImplementationDetails
            }
        }
    };
}

export function assertFirstConsentRequest(request: RequestInit, actualConsentData: DataObject) {
    const { body, baseExpectation } = assertBaseConsentRequest(request, actualConsentData);

    expect(body).toEqual(expect.objectContaining({
        ...baseExpectation,
        "query": {
            "identity": testFetchECIDQuery.identity,
            "consent": testSetConsentQuery.consent
        }
    }));
}

export function assertConsecutiveConsentRequest(request: RequestInit, actualConsentData: DataObject) {
    const { body, baseExpectation } = assertBaseConsentRequest(request, actualConsentData);

    expect(body).toEqual(expect.objectContaining({
        ...baseExpectation,
        "xdm": {
            ...baseExpectation.xdm,
            "identityMap": expect.objectContaining(testIdentityMap)
        },
        "query": testSetConsentQuery,
        "meta": expect.any(Object)
    }));
}

export async function assertEdgeResponse(response: Response, expectedHandles: string[]) {
    const clonedResponse = response.clone();

    expect(clonedResponse.status).toBe(200);
    expect(clonedResponse.statusText).toBe("OK");

    const jsonResponse = await clonedResponse.text();
    const jsonResponseObject = JSON.parse(jsonResponse);
    expect(jsonResponseObject).toBeDefined();
    expect(jsonResponseObject.requestId).toBeDefined();
    expect(jsonResponseObject.handle).toBeDefined();

    assertEdgeHandles(expectedHandles, jsonResponseObject.handle);
}

export async function assertEdgeErrorResponse(response: Response, expectedError: {status: number, statusText: string, title: string}) {
    const clonedResponse = response.clone();
    const jsonResponse = await clonedResponse.json();

    expect(response.status).toBe(expectedError.status);
    expect(response.statusText).toBe(expectedError.statusText);
    expect(jsonResponse).toBeDefined();
    expect(jsonResponse.title).toContain(expectedError.title);
}

function getMetaPayloadForDatastreamIdPayload(originalDataStreamIdForOverride: string) {
    return {
        "sdkConfig": {
            "datastream" :{
                "original": originalDataStreamIdForOverride,
            }
        }
    }
}

function getMetaPayloadForDatastreamConfigOverride(datastreamConfigOverride: DataObject) {
    return {
        "configOverrides": datastreamConfigOverride
    }
}
