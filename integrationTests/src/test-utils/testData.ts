import { DataObject } from "@adobe/kepler-aepcore/src/core/eventhub/EventData";

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
export const expectedEdgeResponseHandlesForFirstRequest = ['identity:result', 'locationHint:result', 'state:store'];

export const expectedEdgeResponseHandlesForConsecutiveRequest = ['locationHint:result', 'state:store'];

export const expectedConsentResponseHandlesForFirstRequest = ['identity:result', 'locationHint:result', 'state:store', 'consent:preferences'];

export const expectedConsentResponseHandlesForConsecutiveRequest = ['locationHint:result', 'state:store', 'consent:preferences'];

export const testFetchECIDQuery = {
    "identity": {
        "fetch": [
            "ECID",
        ],
    },
}

export const testSetConsentQuery = {
    "consent":{
        "operation":"update"
    }
}

export function getTestSendEvent(eventType: string, sdkConfiguration: DataObject = {}, datastreadmIdOverride: boolean = false, configOverride: boolean = false) {
    const baseSendEventData = {
        "xdm": {
            "eventType": `KeplerIntegrationTest::${eventType}`,
        },
        "data": {
            "key": "value"
        },
        "config": {}
    }

    if (datastreadmIdOverride) {
        baseSendEventData["config"] = {
            "datastreamIdOverride": sdkConfiguration["datastreamIdOverride"]
        }
    }

    if (configOverride) {
        baseSendEventData["config"] = {
            ...baseSendEventData.config,
            "datastreamConfigOverride": sdkConfiguration["datastreamConfigOverride"]
        }
    }

    return baseSendEventData;
}

export const testImplementationDetails = {
    "environment": "app",
    "name": "https://ns.adobe.com/experience/mobilesdk/js",
    "version": "1.0.0-beta.2"
}

export const testIdentityMap = {
    "ECID": [
        {
            "authenticatedState": "ambiguous",
            "id": expect.any(String),
            "primary": true,
        }
    ]
}

export function getTestConsentData(consentValue: string) {
    return {
        "consent": [
            {
                "standard": "Adobe",
                "version": "2.0",
                "value": {
                    "collect": {
                        "val": consentValue,
                    },
                    "metadata": {
                    "time": new Date().toISOString(),
                    }
                }
            }
        ]
    }
}
