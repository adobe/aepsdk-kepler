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

import { IdentityManager } from '../../../src/edge/identity/IdentityManager';
import { DataStore } from '../../../src/core/services/DataStore';
import { EdgeConstants } from '../../../src/edge/EdgeConstants';

// Mock the DataStore module
jest.mock('../../../src/core/services/DataStore');

describe('IdentityManager tests', () => {
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

    test('IdentityManager should be defined', () => {
        const identityManager = new IdentityManager(mockDataStore);
        expect(identityManager).toBeDefined();
    });

    test('getECID returns ECID when set in memory', async () => {
        const identityManager = new IdentityManager(mockDataStore);
        identityManager._updateECID('mockECID');

        const ecid = await identityManager.getECID();
        expect(ecid).toBe('mockECID');
    });

    test('getECID returns persisted ECID when not set in memory', async () => {
        mockDataStore.loadData.mockResolvedValue('persistedECID');
        const identityManager = new IdentityManager(mockDataStore);

        const ecid = await identityManager.getECID();
        expect(ecid).toBe('persistedECID');
        expect(mockDataStore.loadData).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID);
    });

    test('getECID returns null when ECID is not set or persisted', async () => {
        mockDataStore.loadData.mockResolvedValue(null);
        const identityManager = new IdentityManager(mockDataStore);

        const ecid = await identityManager.getECID();
        expect(ecid).toBeNull();
    });

    test('getIdentityMap returns identity map when ECID is set', async () => {
        const identityManager = new IdentityManager(mockDataStore);
        identityManager._updateECID('mockECID');

        const identityMap = await identityManager.getIdentityMap();
        expect(identityMap).toEqual(new Map([[EdgeConstants.IdentityMap.NameSpace.ECID, 'mockECID']]));
    });

    test('getIdentityMap returns null when ECID is not set', async () => {
        mockDataStore.loadData.mockResolvedValue(null);
        const identityManager = new IdentityManager(mockDataStore);

        const identityMap = await identityManager.getIdentityMap();
        expect(identityMap).toBeNull();
    });

    test('_updateECID updates ECID and persists it', async () => {
        const identityManager = new IdentityManager(mockDataStore);

        identityManager._updateECID('newECID');
        expect(identityManager.getECID()).resolves.toBe('newECID');
        expect(mockDataStore.saveData).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID, 'newECID');
    });

    test('_updateECID deletes ECID when null is passed', async () => {
        const identityManager = new IdentityManager(mockDataStore);
        identityManager._updateECID('mockECID');

        identityManager._updateECID(null);
        expect(mockDataStore.saveData).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID, null);
    });
});
