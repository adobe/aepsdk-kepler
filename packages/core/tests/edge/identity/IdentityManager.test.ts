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

import { IdentityManager } from "../../../src/edge/identity/IdentityManager";
import { DataStore } from "../../../src/core/services/DataStore";
import { EdgeConstants } from "../../../src/edge/EdgeConstants";

// Mock the DataStore module
jest.mock("../../../src/core/services/DataStore");

describe("IdentityManager tests", () => {
  let mockDataStore: jest.Mocked<DataStore>;
  const mockDispatchFn = jest.fn();

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

  test("IdentityManager should be defined", () => {
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    expect(identityManager).toBeDefined();
  });

  test("bootUp should set ECID in memory", async () => {
    mockDataStore.get.mockResolvedValue("persistedECID");
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    await identityManager.bootUp();
    expect(identityManager.getECID()).toBe("persistedECID");
  });

  test("bootUp sets ECID to null in memory when ECID not found in persistence", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    await identityManager.bootUp();
    expect(identityManager.getECID()).toBeNull();
  });

  test("getECID returns null even when ECID exists in persistence, when bootUp is not called before", async () => {
    mockDataStore.get.mockResolvedValue("persistedECID");
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    const ecid = identityManager.getECID();
    expect(ecid).toBeNull();
    expect(mockDataStore.get).not.toBeCalled();
  });

  test("getIdentityMap returns identity map when ECID is set", async () => {
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    identityManager.updateECID("mockECID");

    const identityMap = identityManager.getIdentityMap();
    expect(identityMap).toEqual({
      ECID: [{ authenticatedState: "ambiguous", id: "mockECID", primary: true }],
    });
  });

  test("getIdentityMap returns null when ECID is not set", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    const identityMap = identityManager.getIdentityMap();
    expect(identityMap).toBeNull();
  });

  test("updateECID updates ECID and persists it", async () => {
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    identityManager.updateECID("newECID");
    expect(identityManager.getECID()).toBe("newECID");
    expect(mockDataStore.set).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID, "newECID");
  });

  test("updateECID deletes ECID when null is passed", async () => {
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);

    identityManager.updateECID("mockECID");
    expect(mockDataStore.set).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID, "mockECID");

    identityManager.updateECID(null);
    expect(mockDataStore.delete).toHaveBeenCalledWith(EdgeConstants.DataStoreKey.ECID);
  });

  test("processEdgeResponse updates ECID when set in response handle", async () => {
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [
        {
          namespace: {
            code: "ECID",
          },
          id: "newECID",
        },
      ],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe("newECID");

    const actualRequestId = mockDispatchFn.mock.calls[0][0];
    const actualEcid = mockDispatchFn.mock.calls[0][1];

    expect(actualEcid).toBe("newECID");
    expect(actualRequestId).toBe("testRequestId");
  });

  test("processEdgeResponse does not update ECID when not set in response handle", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [
        {
          namespace: {
            code: "nonECID",
          },
          id: "newECID",
        },
      ],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });

  test("processEdgeResponse does not update ECID when payload is null", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: null,
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });

  test("processEdgeResponse does not update ECID when payload is empty", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });

  test("processEdgeResponse does not update ECID when namespace is null", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [
        {
          id: "newECID",
        },
      ],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });

  test("processEdgeResponse does not update ECID when namespace is empty", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [
        {
          namespace: {},
          id: "newECID",
        },
      ],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });

  test("processEdgeResponse does not update ECID when namespace code is empty", async () => {
    mockDataStore.get.mockResolvedValue(null);
    const identityManager = new IdentityManager(mockDataStore, mockDispatchFn);
    const responseHandle = {
      payload: [
        {
          namespace: {
            code: "",
          },
          id: "newECID",
        },
      ],
    };

    identityManager.processEdgeResponse(responseHandle, "testRequestId");
    expect(identityManager.getECID()).toBe(null);
    expect(mockDispatchFn).not.toBeCalled();
  });
});
