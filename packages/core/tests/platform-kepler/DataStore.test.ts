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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { VegaDataStore } from "../../src/platform-kepler/DataStore";
describe("VegaDataStore", () => {
  let vegaDataStore: VegaDataStore;

  beforeEach(() => {
    vegaDataStore = new VegaDataStore();
    jest.clearAllMocks();
  });

  test("get() should retrieve value for a given key", async () => {
    const key = "testKey";
    const value = "testValue";
    const prefixedKey = `adb_aep_${key}`;

    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue(value);

    const result = await vegaDataStore.get(key);

    expect(AsyncStorage.getItem).toBeCalledWith(prefixedKey);
    expect(result).toBe(value);
  });

  test("get() should return null if key does not exist", async () => {
    const key = "nonExistentKey";
    const prefixedKey = `adb_aep_${key}`;

    jest.spyOn(AsyncStorage, "getItem").mockResolvedValue(null);

    const result = await vegaDataStore.get(key);

    expect(AsyncStorage.getItem).toBeCalledWith(prefixedKey);
    expect(result).toBeNull();
  });

  test("get() should handle errors gracefully", async () => {
    const key = "errorKey";
    const prefixedKey = `adb_aep_${key}`;
    const errorMessage = "AsyncStorage error";

    jest.spyOn(AsyncStorage, "getItem").mockRejectedValue(new Error(errorMessage));

    const result = await vegaDataStore.get(key);

    expect(AsyncStorage.getItem).toBeCalledWith(prefixedKey);
    expect(result).toBeNull();
  });

  test("set() should save value for a given key", () => {
    const key = "testKey";
    const value = "testValue";
    const prefixedKey = `adb_aep_${key}`;

    jest.spyOn(AsyncStorage, "setItem").mockResolvedValue();

    vegaDataStore.set(key, value);

    expect(AsyncStorage.setItem).toBeCalledWith(prefixedKey, value);
  });

  test("set() should handle errors gracefully", () => {
    const key = "errorKey";
    const value = "errorValue";
    const prefixedKey = `adb_aep_${key}`;
    const errorMessage = "AsyncStorage error";

    jest.spyOn(AsyncStorage, "setItem").mockRejectedValue(new Error(errorMessage));

    vegaDataStore.set(key, value);

    expect(AsyncStorage.setItem).toBeCalledWith(prefixedKey, value);
  });

  test("delete() should remove value for a given key", () => {
    const key = "testKey";
    const prefixedKey = `adb_aep_${key}`;

    jest.spyOn(AsyncStorage, "removeItem").mockResolvedValue();

    vegaDataStore.delete(key);

    expect(AsyncStorage.removeItem).toBeCalledWith(prefixedKey);
  });

  test("delete() should handle errors gracefully", () => {
    const key = "errorKey";
    const prefixedKey = `adb_aep_${key}`;
    const errorMessage = "AsyncStorage error";

    jest.spyOn(AsyncStorage, "removeItem").mockRejectedValue(new Error(errorMessage));

    vegaDataStore.delete(key);

    expect(AsyncStorage.removeItem).toBeCalledWith(prefixedKey);
  });
});
