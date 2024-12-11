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
  getAsDataObject,
  getAsBoolean,
  getAsNumber,
  getAsString,
  getAsDataArray,
} from "../../../src/core/utils/DataTypeUtil";

describe("DataType utils", () => {
  test("getAsDataObject() returns null for invalid object values", () => {
    const invalidObj = [[], 1, "", true, null, undefined];
    invalidObj.forEach((obj) => {
      expect(getAsDataObject(obj)).toBeNull();
    });
  });

  test("getAsDataObject() returns object for valid object values", () => {
    const validObj = [
      {},
      { key: "value" },
      { key: 1 },
      { key: true },
      { key: null },
      { key: undefined },
    ];
    validObj.forEach((obj) => {
      expect(getAsDataObject(obj)).toEqual(obj);
    });
  });

  test("getAsDataArray() returns null for invalid array values", () => {
    const invalidArr = [{}, 1, "", true, null, undefined];
    invalidArr.forEach((arr) => {
      expect(getAsDataArray(arr)).toBeNull();
    });
  });

  test("getAsDataArray() returns array for valid array values", () => {
    const validArr = [
      [],
      [{ key: "value" }],
      [{ key: 1 }],
      [{ key: true }],
      [{ key: null }],
      [{ key: undefined }],
      ["str1", "str2"],
      [1, 2],
      [1.1, 2],
      [true, false],
    ];
    validArr.forEach((arr) => {
      expect(getAsDataArray(arr)).toEqual(arr);
    });
  });

  test("getAsNumber() returns null for invalid number values", () => {
    const invalidNum = [{}, [], "", "1", "test", true, null, undefined];
    invalidNum.forEach((num) => {
      expect(getAsNumber(num)).toBeNull();
    });
  });

  test("getAsNumber() returns number for valid number values", () => {
    const validNum = [1, 0, -1, 1.1, -1.1];
    validNum.forEach((num) => {
      expect(getAsNumber(num)).toEqual(num);
    });
  });

  test("getAsBoolean() returns null for invalid boolean values", () => {
    const invalidBool = [{}, [], "", "true", 1, -1, null, undefined];
    invalidBool.forEach((bool) => {
      expect(getAsBoolean(bool)).toBeNull();
    });
  });

  test("getAsBoolean() returns boolean for valid boolean values", () => {
    const validBool = [true, false];
    validBool.forEach((bool) => {
      expect(getAsBoolean(bool)).toEqual(bool);
    });
  });

  test("getAsString() returns null for invalid string values", () => {
    const invalidStr = [{}, [], true, 1, null, undefined, ["a", "b"]];
    invalidStr.forEach((str) => {
      expect(getAsString(str)).toBeNull();
    });
  });

  test("getAsString() returns string for valid string values", () => {
    const validStr = ["", "string", "1", "true", "null", "undefined"];
    validStr.forEach((str) => {
      expect(getAsString(str)).toEqual(str);
    });
  });
});
