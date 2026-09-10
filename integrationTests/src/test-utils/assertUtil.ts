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

/*
******************************************************
* Assert Utils
******************************************************
*/

export function assertEdgeHandles(expectedHandleTypes: Array<string>, responseHandles: Array<Record<string, unknown>>) {
    const expectedHandleMap: { [key: string]: boolean } = {}
    expectedHandleTypes.forEach(type => {
        expectedHandleMap[type] = false;
    });

    responseHandles.forEach(handle => {
        const handleType = handle.type as string;
        expect(handleType).toBeDefined();
        if (expectedHandleMap[handleType] !== undefined) {
            expectedHandleMap[handleType] = true;
        }
    });

    expectedHandleTypes.forEach(type => {
        try {
            expect(expectedHandleMap[type]).toBe(true);
        } catch (error) {
            throw new Error(`Expected handle type ${type} not found in response. ${error}`);
        }
    });
}

// Edge routes requests through the caller's nearest region, so the location-hint
// segment in the path (e.g. /ee/or2/... in the US, /ee/ind1/... in India) varies by
// network. Normalize it so path assertions verify shape + presence of a hint without
// pinning a specific region. Matches a hint segment like "or2"/"ind1" ([a-z]{2,4}[0-9]+)
// right after /ee/, leaving non-hinted segments ("va", "v1") untouched.
function normalizeLocationHint(path: string): string {
    return path.replace(/\/ee\/[a-z]{2,4}[0-9]+\//, '/ee/<hint>/');
}

export function assertRequestUrl(url: URL, expectedHostname: string, expectedPath: string, expectedDatastreamId: string) {
    const requestId = url.searchParams.get('requestId');
    const configId = url.searchParams.get('configId');

    expect(url.hostname).toEqual(expectedHostname);
    expect(normalizeLocationHint(url.pathname)).toEqual(normalizeLocationHint(expectedPath));
    expect(configId).toEqual(expectedDatastreamId);
    expect(requestId).toBeDefined();
}
