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

import { LocationHintManager } from '../../src/edge/LocationHintManager';
import { DataStore } from '../../src/core/services/DataStore';

// Mock the DataStore module
jest.mock('../../src/core/services/DataStore');

describe('LocationHintManager', () => {
    let mockDataStore: jest.Mocked<DataStore>;

    beforeEach(() => {
        // Create a mocked instance of DataStore
        mockDataStore = {
            saveData: jest.fn(),
            loadData: jest.fn(),
        } as jest.Mocked<DataStore>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

  it('LocationHintManager should be defined', () => {
    const locationHintManager = new LocationHintManager(mockDataStore);
    expect(locationHintManager).toBeDefined();
  });

    it('getLocationHint returns location hint when set in memory', async () => {
        const locationHintManager = new LocationHintManager(mockDataStore);
        locationHintManager.setLocationHint('mockLocationHint', 1800);

        const locationHint = await locationHintManager.getLocationHint();
        expect(locationHint).toBe('mockLocationHint');
    });

    it('getLocationHint returns persisted location hint when not set in memory', async () => {
        const mockLocationHintJson = JSON.stringify({ hint: 'persistedLocationHint', expiryTS: (Date.now() + 1800) });
        mockDataStore.loadData.mockResolvedValue(mockLocationHintJson);

        const locationHintManager = new LocationHintManager(mockDataStore);

        const locationHint = await locationHintManager.getLocationHint();
        expect(locationHint).toBe('persistedLocationHint');
        expect(mockDataStore.loadData).toHaveBeenCalledWith('locationHint');
    });

    it('getLocationHint returns null when location hint is not set or persisted', async () => {
        mockDataStore.loadData.mockResolvedValue(null);
        const locationHintManager = new LocationHintManager(mockDataStore);

        const locationHint = await locationHintManager.getLocationHint();
        expect(locationHint).toBe(null);
        expect(mockDataStore.loadData).toHaveBeenCalledWith('locationHint');
    });

    it('getLocationHint returns null when location hint is expired', async () => {
        const mockLocationHintJson = JSON.stringify({ hint: 'expiredLocationHint', expiryTS: (Date.now() - 1) });
        mockDataStore.loadData.mockResolvedValue(mockLocationHintJson);

        const locationHintManager = new LocationHintManager(mockDataStore);

        const locationHint = await locationHintManager.getLocationHint();
        expect(locationHint).toBe(null);
        expect(mockDataStore.loadData).toHaveBeenCalledWith('locationHint');
    });

    it('setLocationHint persists location hint', async () => {
        const locationHintManager = new LocationHintManager(mockDataStore);
        await locationHintManager.setLocationHint('mockLocationHint', 100, 0);

        const expectedLocationHintJson =
        JSON.stringify({ value: 'mockLocationHint', expiryTS: (100000) });
        expect(mockDataStore.saveData).toHaveBeenCalledWith('locationHint', expectedLocationHintJson);
    });
});
