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

import { LocationHintManager } from "../../src/edge/LocationHintManager";
import { DataStore } from "../../src/core/services/DataStore";
import { DataArray, DataObject } from "../../src/core/eventhub/EventData";

// Mock the DataStore module
jest.mock("../../src/core/services/DataStore");

describe("LocationHintManager", () => {
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

  test("LocationHintManager should be defined", () => {
    const locationHintManager = new LocationHintManager(mockDataStore);
    expect(locationHintManager).toBeDefined();
  });

  test("getLocationHint returns location hint when set in memory", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);
    locationHintManager.setLocationHint("mockLocationHint", 1800);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe("mockLocationHint");
  });

  test("bootUp loads persisted location hint", async () => {
    const mockLocationHintJson = JSON.stringify({
      value: "persistedLocationHint",
      expiryTS: Date.now() + 1800,
    });
    mockDataStore.get.mockResolvedValue(mockLocationHintJson);

    const locationHintManager = new LocationHintManager(mockDataStore);
    await locationHintManager.bootUp();

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe("persistedLocationHint");
    expect(mockDataStore.get).toHaveBeenCalledWith("edge.locationHint");
  });

  test("bootUp sets location hint to null when persisted location hint is not present in persistence", async () => {
    mockDataStore.get.mockResolvedValue(null);

    const locationHintManager = new LocationHintManager(mockDataStore);
    await locationHintManager.bootUp();

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(mockDataStore.get).toHaveBeenCalledWith("edge.locationHint");
  });

  test("getLocationHint without bootUp will return null even when locationHint is persisted on the DataStore", async () => {
    const mockLocationHintJson = JSON.stringify({
      value: "persistedLocationHint",
      expiryTS: Date.now() + 1800,
    });
    mockDataStore.get.mockResolvedValue(mockLocationHintJson);

    const locationHintManager = new LocationHintManager(mockDataStore);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBeNull();
    expect(mockDataStore.get).not.toHaveBeenCalled();
  });

  test("getLocationHint returns null when location hint is expired", async () => {
    const mockLocationHintJson = JSON.stringify({
      hint: "expiredLocationHint",
      expiryTS: Date.now() - 1,
    });
    mockDataStore.get.mockResolvedValue(mockLocationHintJson);

    const locationHintManager = new LocationHintManager(mockDataStore);
    await locationHintManager.bootUp(); // load persisted location hint

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(mockDataStore.get).toHaveBeenCalledWith("edge.locationHint");
  });

  test("setLocationHint persists location hint", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);
    await locationHintManager.setLocationHint("mockLocationHint", 100, 0);

    const expectedLocationHintJson = JSON.stringify({
      value: "mockLocationHint",
      expiryTS: 100000,
    });
    expect(mockDataStore.set).toHaveBeenCalledWith("edge.locationHint", expectedLocationHintJson);
  });

  test("test processEdgeResponse with location hint", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const responseHandle = {
      payload: [
        {
          scope: "EdgeNetwork",
          hint: "mockLocationHint",
          ttlSeconds: 100,
        },
      ],
    };

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe("mockLocationHint");
    expect(locationHintManager.setLocationHint).toHaveBeenCalledWith("mockLocationHint", 100);
  });

  test("test processEdgeResponse without EdgeNetwork scope", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const responseHandle = {
      payload: [
        {
          scope: "InvalidScope",
          hint: "mockLocationHint",
          ttlSeconds: 100,
        },
      ],
    };

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(locationHintManager.setLocationHint).not.toHaveBeenCalled();
  });

  test("test processEdgeResponse without hint", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);
    const responseHandle = {
      payload: [
        {
          scope: "EdgeNetwork",
          ttlSeconds: 100,
        },
      ],
    };

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(locationHintManager.setLocationHint).not.toHaveBeenCalled();
  });

  test("test processEdgeResponse without ttlSeconds and sets to default ttl.", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const responseHandle = {
      payload: [
        {
          scope: "EdgeNetwork",
          hint: "mockLocationHint",
        },
      ],
    };

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe("mockLocationHint");
    expect(locationHintManager.setLocationHint).toHaveBeenCalledWith("mockLocationHint", 1800);
  });

  test("test processEdgeResponse without hint and ttlSeconds", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const responseHandle = {
      payload: [
        {
          scope: "EdgeNetwork",
        },
      ],
    };

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(locationHintManager.setLocationHint).not.toHaveBeenCalled();
  });

  test("test processEdgeResponse responsehandle missing payload", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const invalidResponseHandles: DataArray = [{}, { payload: null }, { payload: [] }];

    for (let i = 0; i < invalidResponseHandles.length; i++) {
      const responseHandle = (invalidResponseHandles[i] as DataObject) ?? {};

      locationHintManager.processEdgeResponse(responseHandle);

      const locationHint = locationHintManager.getLocationHint();
      expect(locationHint).toBe(null);
      expect(locationHintManager.setLocationHint).not.toHaveBeenCalled();
    }
  });

  test("test processEdgeResponse responsehandle missing scope", async () => {
    const locationHintManager = new LocationHintManager(mockDataStore);

    // spy the setLocationHint method
    jest.spyOn(locationHintManager, "setLocationHint");

    const responseHandle = {
      payload: [
        {
          hint: "mockLocationHint",
          ttlSeconds: 100,
        },
      ],
    };

    locationHintManager.processEdgeResponse(responseHandle);

    const locationHint = locationHintManager.getLocationHint();
    expect(locationHint).toBe(null);
    expect(locationHintManager.setLocationHint).not.toHaveBeenCalled();
  });
});
