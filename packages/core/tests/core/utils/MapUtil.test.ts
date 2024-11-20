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

import {
  optMap,
  mapFromObject,
  isNullOrEmptyMap,
  mapFromJson,
  mapToJson,
  mapToObject,
} from "../../../src/core/utils/MapUtil";

describe("MapUtil tests", () => {
  test("isNullOrEmpty returns true when map is null, undefined or empty", () => {
    const input = [null, undefined, new Map()];

    for (const map of input) {
      const result = isNullOrEmptyMap(map);
      expect(result).toBe(true);
    }
  });

  test("isNullOrEmpty returns false for valid non empty map", () => {
    const input = [new Map([["key", "value"]])];

    for (const map of input) {
      const result = isNullOrEmptyMap(map);
      expect(result).toBe(false);
    }
  });

  test("optMapFrom returns empty map when obj is empty", () => {
    const obj = {};
    const key = "key";
    const fallback = new Map<string, any>();
    const result = optMap(obj, key, fallback);
    expect(result instanceof Map).toBe(true);
    expect(result === null).toBe(false);
    expect(result?.size).toBe(0);
  });

  test("optMapFrom returns fallback result is not an object", () => {
    const obj = { key: "value" };
    const key = "key";
    const fallback = new Map<string, any>();
    const result = optMap(obj, key, fallback);
    expect(result).toBe(fallback);
  });

  test("optMapFrom returns fallback when result is undefined", () => {
    const obj = { key: undefined };
    const key = "key";
    const fallback = new Map<string, any>();
    const result = optMap(obj, key, fallback);
    expect(result).toBe(fallback);
  });

  test("optMapFrom returns fallback when key is not found", () => {
    const obj = {};
    const key = "key";
    const fallback = new Map<string, any>();
    const result = optMap(obj, key, fallback);
    expect(result).toBe(fallback);
  });

  test("optMapFrom returns empty map when fallback is not provided", () => {
    const obj = { key: null };
    const key = "key";
    const result = optMap(obj, key);
    expect(result instanceof Map).toBe(true);
    expect(result === null).toBe(false);
    expect(result?.size).toBe(0);
  });

  test("optMapFrom returns proper value when input is a map", () => {
    const obj = new Map<string, any>();
    obj.set("key", {
      nested_key: "nested_value",
    });
    const key = "key";
    const fallback = new Map<string, any>();
    const result = optMap(obj, key, fallback);
    expect(result instanceof Map).toBe(true);
    expect(result?.size).toBe(1);
  });

  test("mapFromObject works recrusively and all nested objects are converted to map", () => {
    const obj = {
      key: {
        nested_key_1: {
          nested_key_1_1: "nested_value_1_1",
          nested_key_1_2: {
            nest_key_1_2_1: {
              nest_key_1_2_1_1: "nested_value_1_2_1_1",
              nest_key_1_2_1_2: () => {
                console.log("I am a function and will not be included in the output");
              },
            },
          },
          nested_key_1_3: 12,
          nested_key_1_4: 2.3,
          nested_key_1_5: true,
          nested_key_1_6: false,
        },
        nested_key_2: new Map([
          ["nested_key_2_1", "nested_value_2_1"],
          ["nested_key_2_2", "123"],
          ["nested_key_2_3", null],
        ]),

        nested_key_3: () => {
          console.log("I am a function and will not be included in the output");
        },
      },
    };

    const result = mapFromObject(obj);

    expect(result instanceof Map).toBe(true);
    expect(result?.size).toBe(1);

    const keyMap = result?.get("key");
    expect(keyMap instanceof Map).toBe(true);
    expect(keyMap?.size).toBe(2);

    const nestedKey_1Map = keyMap?.get("nested_key_1");
    expect(nestedKey_1Map instanceof Map).toBe(true);
    expect(nestedKey_1Map?.size).toBe(6);
    expect(nestedKey_1Map?.get("nested_key_1_1")).toBe("nested_value_1_1");
    expect(nestedKey_1Map?.get("nested_key_1_3")).toBe(12);
    expect(nestedKey_1Map?.get("nested_key_1_4")).toBe(2.3);
    expect(nestedKey_1Map?.get("nested_key_1_5")).toBe(true);
    expect(nestedKey_1Map?.get("nested_key_1_6")).toBe(false);

    const nestedKey_1_2Map = nestedKey_1Map?.get("nested_key_1_2");
    expect(nestedKey_1_2Map instanceof Map).toBe(true);
    expect(nestedKey_1_2Map?.size).toBe(1);

    //verify the function is not included in the output
    const nestKey_1_2_1Map = nestedKey_1_2Map?.get("nest_key_1_2_1");
    expect(nestKey_1_2_1Map instanceof Map).toBe(true);
    // key with function as value should not be included
    expect(nestKey_1_2_1Map?.size).toBe(1);
    // value will be undefined as the key is not present in the map
    expect(nestKey_1_2_1Map?.get("nest_key_1_2_1_2")).toBe(undefined);

    const nestedKey_2Map = keyMap?.get("nested_key_2");
    expect(nestedKey_2Map instanceof Map).toBe(true);
    expect(nestedKey_2Map?.size).toBe(3);
    expect(nestedKey_2Map?.get("nested_key_2_1")).toBe("nested_value_2_1");
    expect(nestedKey_2Map?.get("nested_key_2_2")).toBe("123");
    expect(nestedKey_2Map?.get("nested_key_2_3")).toBe(null);

    // value will be undefined as the key is not present in the map
    expect(keyMap?.get("nested_key_3")).toBe(undefined);
  });

  test("mapToObject converts map to object", () => {
    const map = new Map<string, any>([
      ["key1", "value1"],
      [
        "key2",
        new Map<string, any>([
          ["nested_key", "nested_value"],
          [
            "nested_key_2",
            new Map<string, any>([
              ["nested_key_2_1", "nested_value_2_1"],
              ["nested_key_2_2", "nested_value_2_2"],
            ]),
          ],
        ]),
      ],
      ["key3", 3],
      ["key4", null],
      ["key5", true],
      ["key6", false],
      ["key7", 2.3],
    ]);

    const result = mapToObject(map);
    expect(result).toEqual({
      key1: "value1",
      key2: {
        nested_key: "nested_value",
        nested_key_2: {
          nested_key_2_1: "nested_value_2_1",
          nested_key_2_2: "nested_value_2_2",
        },
      },
      key3: 3,
      key4: null,
      key5: true,
      key6: false,
      key7: 2.3,
    });
  });

  test("mapToJson converts map to json", () => {
    const map = new Map<string, any>([
      ["key1", "value1"],
      ["key2", new Map([["nested_key", "nested_value"]])],
      ["key3", 3],
      ["key4", null],
      ["key5", true],
      ["key6", false],
      ["key7", 2.3],
    ]);

    const result = mapToJson(map);
    expect(result).toBe(
      '{"key1":"value1","key2":{"nested_key":"nested_value"},"key3":3,"key4":null,"key5":true,"key6":false,"key7":2.3}'
    );
  });

  test("mapFromJson converts json to map", () => {
    const json =
      '{"key1":"value1","key2":{"nested_key":"nested_value"}, "key3": 3, "key4": null, "key5": true, "key6": false, "key7": 2.3}';
    const result = mapFromJson(json);

    expect(result instanceof Map).toBe(true);
    expect(result?.size).toBe(7);
    expect(result?.get("key1")).toBe("value1");

    const nestedMap = result?.get("key2");
    expect(nestedMap instanceof Map).toBe(true);
    expect(nestedMap?.size).toBe(1);
    expect(nestedMap?.get("nested_key")).toBe("nested_value");

    expect(result?.get("key3")).toBe(3);
    expect(result?.get("key4")).toBe(null);
    expect(result?.get("key5")).toBe(true);
    expect(result?.get("key6")).toBe(false);
    expect(result?.get("key7")).toBe(2.3);
  });

  test("mapFromJson returns empty map when json is empty", () => {
    const invalidJson = ["key1: value1", "{key1: value1}", "key1: value1, key2: value2", ""];

    for (const json of invalidJson) {
      const result = mapFromJson(json);
      expect(result).toBe(null);
    }
  });
});
