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
            loadDate: jest.fn(),
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
        mockDataStore.loadDate.mockResolvedValue('persistedECID');
        const identityManager = new IdentityManager(mockDataStore);

        const ecid = await identityManager.getECID();
        expect(ecid).toBe('persistedECID');
        expect(mockDataStore.loadDate).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID);
    });

    test('getECID returns null when ECID is not set or persisted', async () => {
        mockDataStore.loadDate.mockResolvedValue(null);
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
        mockDataStore.loadDate.mockResolvedValue(null);
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
