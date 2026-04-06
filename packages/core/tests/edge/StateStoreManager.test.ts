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

import { StateStoreManager } from "../../src/edge/StateStoreManager";
import { DataStore } from "../../src/core/services/DataStore";

// Mock the DataStore module
jest.mock("../../src/core/services/DataStore");

describe("StateStoreManager", () => {
  let mockDataStore: jest.Mocked<DataStore>;

  beforeEach(() => {
    // Create a mocked instance of DataStore
    mockDataStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<DataStore>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("StateStoreManager should be defined", () => {
    const locationHintManager = new StateStoreManager(mockDataStore);
    expect(locationHintManager).toBeDefined();
  });

  test("processEdgeResponse with valid payload, adds to state store and persists it.", () => {
    const stateStoreManager = new StateStoreManager(mockDataStore);
    const responseHandle = {
      payload: [
        {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          maxAge: 1800,
        },
      ],
      type: "state:store",
    };

    const testTS = Date.now();

    stateStoreManager.processEdgeResponse(responseHandle);
    expect(mockDataStore.set).toHaveBeenCalledWith(
      "edge.stateStore",
      JSON.stringify({
        kndctr_1234_AdobeOrg_cluster: {
          payload: {
            key: "kndctr_1234_AdobeOrg_cluster",
            value: "or2",
            maxAge: 1800,
          },
          expiryTS: testTS + 1800 * 1000,
        },
      })
    );
  });

  test("processEdgeResponse with invalid payload, does not add to state store.", () => {
    const stateStoreManager = new StateStoreManager(mockDataStore);
    const invalidhandle1 = {
      // missing payload list
      type: "state:store",
    };

    stateStoreManager.processEdgeResponse(invalidhandle1);
    expect(mockDataStore.set).not.toHaveBeenCalled();

    const invalidhandle2 = {
      payload: [
        // missing key
        {
          value: "or2",
          maxAge: 1800,
        },
      ],
      type: "state:store",
    };

    stateStoreManager.processEdgeResponse(invalidhandle2);
    expect(mockDataStore.set).not.toHaveBeenCalled();

    const invalidhandle3 = {
      payload: [
        {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          // missing maxAge
        },
      ],
      type: "state:store",
    };

    stateStoreManager.processEdgeResponse(invalidhandle3);
    expect(mockDataStore.set).not.toHaveBeenCalled();

    const invalidhandle4 = {
      payload: [
        // empty payload list
      ],
      type: "state:store",
    };

    stateStoreManager.processEdgeResponse(invalidhandle4);
    expect(mockDataStore.set).not.toHaveBeenCalled();
  });

  test("bootUp initializes state store from persistence", async () => {
    const mockStateStoreJson = JSON.stringify({
      kndctr_1234_AdobeOrg_cluster: {
        payload: {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          maxAge: 1800,
        },
        expiryTS: Date.now() + 1000, //set expiry in future
      },
    });
    mockDataStore.get.mockResolvedValue(mockStateStoreJson);

    const stateStoreManager = new StateStoreManager(mockDataStore);

    await stateStoreManager.bootUp();
    expect(mockDataStore.get).toHaveBeenCalledWith("stateStore");
    expect(stateStoreManager.getStateStore()).toEqual([
      {
        key: "kndctr_1234_AdobeOrg_cluster",
        value: "or2",
        maxAge: 1800,
      },
    ]);
  });

  test("getStateStore without bootUp will return empty even when state store is persisted", async () => {
    const stateStoreManager = new StateStoreManager(mockDataStore);

    const stateStore = stateStoreManager.getStateStore(100);
    expect(stateStore).toEqual([]);
    expect(mockDataStore.get).not.toHaveBeenCalled();
  });

  test("getStateStore returns only active state store entries", async () => {
    const mockStateStoreJson = JSON.stringify({
      kndctr_1234_AdobeOrg_cluster: {
        payload: {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          maxAge: 1800,
        },
        expiryTS: 101,
      },
      kndctr_1234_AdobeOrg_cluster2: {
        payload: {
          key: "kndctr_1234_AdobeOrg_cluster2",
          value: "or3",
          maxAge: 1800,
        },
        expiryTS: 99,
      },
      kndctr_1234_AdobeOrg_cluster3: {
        payload: {
          key: "kndctr_1234_AdobeOrg_cluster3",
          value: "or4",
          maxAge: 1800,
        },
        expiryTS: 100,
      },
    });
    mockDataStore.get.mockResolvedValue(mockStateStoreJson);

    const stateStoreManager = new StateStoreManager(mockDataStore);
    await stateStoreManager.bootUp(); // bootUp to load state store from persistence

    const stateStore = await stateStoreManager.getStateStore(100);
    expect(stateStore).toEqual([
      {
        key: "kndctr_1234_AdobeOrg_cluster",
        value: "or2",
        maxAge: 1800,
      },
      {
        key: "kndctr_1234_AdobeOrg_cluster3",
        value: "or4",
        maxAge: 1800,
      },
    ]);
    expect(mockDataStore.get).toHaveBeenCalledWith("stateStore");
  });
});
