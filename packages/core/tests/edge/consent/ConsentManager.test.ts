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

import { ConsentManager, ConsentValue } from '../../../src/edge/consent/ConsentManager';
import { DataStore } from '../../../src/core/services/DataStore';
import { Event, EventType, EventSource, EventData } from "../../../src/core/eventhub";

// Mock the DataStore module
jest.mock('../../../src/core/services/DataStore');

describe('ConsentManager tests', () => {
    let mockDataStore: jest.Mocked<DataStore>;

    beforeEach(() => {
        // Create a mocked instance of DataStore
        mockDataStore = {
            set: jest.fn(),
            get: jest.fn(),
            delete: jest.fn(),
        } as jest.Mocked<DataStore>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('ConsentManager should be defined', () => {
        const consentManager = new ConsentManager(mockDataStore);
        expect(consentManager).toBeDefined();
    });

    test('getConsent returns consent when set in memory', async () => {
        const consentManager = new ConsentManager(mockDataStore);
        consentManager.updateCollectConsent(ConsentValue.YES);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(ConsentValue.YES);
    });

    test('getConsent returns persisted consent when not set in memory', async () => {
        mockDataStore.get.mockResolvedValue(ConsentValue.NO);
        const consentManager = new ConsentManager(mockDataStore);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(ConsentValue.NO);
        expect(mockDataStore.get).toHaveBeenCalledWith('consent.collect');
    });


    test('getConsent returns default consent when not set in memory or persisted', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const configurationData = EventData.buildFrom({
            'consent.default' :{
                "consents": {
                    "collect": {
                        "val": "p"
                    }
                }
            }
        });

        const configurationEvent = new Event("Mock Configuration Event", EventType.CONFIGURATION, EventSource.RESPONSE_CONTENT, configurationData);
        consentManager.processConfigurationEvent(configurationEvent);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(ConsentValue.PENDING);
        expect(mockDataStore.get).toHaveBeenCalledWith('consent.collect');
    });

    test('getConsent returns null when not set in cache or persistence and wrong consent value present in defaultconfiguration', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const configurationData = EventData.buildFrom({
            'consent.default' :{
                "consents": {
                    "collect": {
                        "val": "invalidValue"
                    }
                }
            }
        });

        const configurationEvent = new Event("Mock Configuration Event", EventType.CONFIGURATION, EventSource.RESPONSE_CONTENT, configurationData);
        consentManager.processConfigurationEvent(configurationEvent);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
        expect(mockDataStore.get).toHaveBeenCalledWith('consent.collect');
    });

    test('getConsent returns null when consent is not set in memory, persisted or defaultConfig', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBeNull();
        expect(mockDataStore.get).toHaveBeenCalledWith('consent.collect');
    });

    test('updateConsent updates the consent value', async () => {
        const consentManager = new ConsentManager(mockDataStore);
        consentManager.updateCollectConsent(ConsentValue.YES);

        // Verify that the consent value is saved in the data store
        expect(mockDataStore.set).toHaveBeenCalledWith('consent.collect', ConsentValue.YES);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(ConsentValue.YES);
    });

    test('processEdgeResponse updates the consent value', async () => {
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": [
                {
                    "collect": {
                        "val": "y"
                    }
                }
            ]
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(ConsentValue.YES);
    });

    test('processEdgeResponse does not update the consent value when invalid value is present', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": [
                {
                    "collect": {
                        "val": "invalidValue"
                    }
                }
            ]
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
    });

    test('processEdgeResponse does not update the consent value when collect value is not present', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": [
                {
                    "collect": {
                        "invalidKey": "value"
                    }
                }
            ]
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
    });

    test('processEdgeResponse does not update the consent value when payload is null', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": null
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
    });

    test('processEdgeResponse does not update the consent value when payload is empty', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": []
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
    });

    test('processEdgeResponse does not update the consent value when collect value is not present', async () => {
        mockDataStore.get.mockResolvedValue(null);
        const consentManager = new ConsentManager(mockDataStore);

        const responseHandle = {
            "payload": [
                {
                    "invalidKey": {
                        "val": "y"
                    }
                }
            ]
        };

        consentManager.processEdgeResponse(responseHandle);

        const consent = await consentManager.getCollectConsent();
        expect(consent).toBe(null);
    });
});
