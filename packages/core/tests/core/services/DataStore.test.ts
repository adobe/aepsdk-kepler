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
import { defaultDataStore } from "../../../src/core/services/DataStore";
import { Log } from "../../../src/core/utils/Log";

describe("DefaultDataStore", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("get() should retrieve value for a given key", async () => {
    const key = "testKey";
    const value = "testValue";
    defaultDataStore.set(key, value);

    const result = await defaultDataStore.get(key);

    expect(result).toBe(value);
  });

  test("get() should return null if key does not exist", async () => {
    const key = "nonExistentKey";

    const result = await defaultDataStore.get(key);

    expect(result).toBeNull();
  });

  test("set() should save value for a given key", () => {
    const key = "testKey";
    const value = "testValue";

    defaultDataStore.set(key, value);

    expect(defaultDataStore.get(key)).resolves.toBe(value);
  });

  test("delete() should remove value for a given key", async () => {
    const key = "testKey";
    const value = "testValue";
    defaultDataStore.set(key, value);

    defaultDataStore.delete(key);

    const result = await defaultDataStore.get(key);
    expect(result).toBeNull();
  });

  test("get() should log the correct message", async () => {
    const key = "testKey";
    const value = "testValue";
    defaultDataStore.set(key, value);

    const logSpy = jest.spyOn(Log, "debug");

    await defaultDataStore.get(key);

    expect(logSpy).toBeCalledWith(
      "Services",
      "DefaultDataStore",
      `get() - Retrieving value for key(${key}) from DefaultDataStore`
    );
  });

  test("set() should log the correct message", () => {
    const key = "testKey";
    const value = "testValue";

    const logSpy = jest.spyOn(Log, "debug");

    defaultDataStore.set(key, value);

    expect(logSpy).toBeCalledWith(
      "Services",
      "DefaultDataStore",
      `set() - Saving key(${key}) with value(${value}) to DefaultDataStore`
    );
  });

  test("delete() should log the correct message", () => {
    const key = "testKey";
    const value = "testValue";
    defaultDataStore.set(key, value);

    const logSpy = jest.spyOn(Log, "debug");

    defaultDataStore.delete(key);

    expect(logSpy).toBeCalledWith(
      "Services",
      "DefaultDataStore",
      `delete() - Deleting key(${key}) from DefaultDataStore`
    );
  });
});
