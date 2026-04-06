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
import { DataObject, DataArray } from "../../../dist/core/eventhub/EventData";
import {
  buildDataObject,
  getDataObject,
  getNumber,
  getString,
  getBoolean,
  getNull,
  getArray,
  getDataObjectFromArray,
} from "../../../src/core/utils/DataObjectUtil";
describe("test DataObjectUtil class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("getDataObject() - should build an EventData object, if the input is the standard JSON string", () => {
    const jsonString = `
        {
            "str": "value",
            "num": 1,
            "bool": true,
            "nil": null,
            "arr": [
              "value",
              1,
              true,
              null,
              {
                "key": "value"
              }
            ],
            "obj": {
              "str": "value",
              "arr": [
                "value",
                {
                  "key": "value"
                }
              ],
              "obj": {
                "key": "value"
              }
            }
        }`;
    const data = buildDataObject(jsonString);
    expect(data).not.toBeNull();
  });

  test("getDataObject() - should return null if the input is not a standard JSON string ", () => {
    const jsonString = `
        {
            'key': 'value'
        }`;
    const data = buildDataObject(jsonString);
    expect(data).toBeNull();
  });

  test("getString() - should retrieve string from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": "value2"
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: string | undefined = getString(data, "obj", "key2");
    expect(value).toEqual("value2");
    expect(getString(data, "key1")).toEqual("value1");
  });

  test("getString() - should return undefined if the given path is incorrect", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": "value2"
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    expect(getString(data, "obj", "key3")).toBeUndefined();
    expect(getString(data, "obj1")).toBeUndefined();
    expect(getString(data)).toBeUndefined();
  });

  test("getString() - should return undefined if the type is mismatched", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": "value2",
                "key3": 1234
            },
            "key4": true
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    expect(getString(data, "obj", "key3")).toBeUndefined();
    expect(getString(data, "key4")).toBeUndefined();
  });

  test("getNumber() - should retrieve number from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": ["value2", "value3"],
                "numberKey": 1234
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: number | undefined = getNumber(data, "obj", "numberKey");
    expect(value).not.toBeUndefined();
    expect(value).toEqual(1234);
  });

  test("getNumber() - should return undefined if the type is mismatched", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": ["value2", "value3"],
                "numberKey": 1234
            },
            "key3": "string"
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: number | undefined = getNumber(data, "obj", "key2");
    expect(value).toBeUndefined();
    expect(getNumber(data, "obj", "key3")).toBeUndefined();
  });

  test("getArray() - should retrieve Array from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": ["value2", "value3"]
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: DataArray | undefined = getArray(data, "obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value[0]).toEqual("value2");
    expect(value[1]).toEqual("value3");
    expect(getArray(data)).toBeUndefined();
  });

  test("getArray() - should return undefined if the type is mismatched", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": ["value2", "value3"],
                "key3": 1234
            },
            "key3": "string"
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: DataArray | undefined = getArray(data, "obj", "key3");
    expect(value).toBeUndefined();
    expect(getArray(data, "key4")).toBeUndefined();
  });

  test("getBoolean() - should retrieve boolean from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": true
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: boolean | undefined = getBoolean(data, "obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value).toBeTruthy();
  });

  test("getBoolean() - should return undefined if the type is mismatched", () => {
    const jsonString = `{
            "key1": "value1",
            "obj": {
                "key2": true,
                "key3": 1234
            },
            "key4": "string"
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: boolean | undefined = getBoolean(data, "obj", "key3");
    expect(value).toBeUndefined();
    expect(getBoolean(data, "key4")).toBeUndefined();
    expect(getBoolean(data)).toBeUndefined();
  });

  test("getDataObject() - should retrieve DataObject from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": {
                    "key3": "value3"
                }
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: DataObject | undefined = getDataObject(data, "obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value).toEqual({ key3: "value3" });
  });

  test("getDataObject() - should retrieve the data root if the path is empty", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": {
                    "key3": "value3"
                }
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: DataObject | undefined = getDataObject(data);
    if (value === undefined) {
      fail("value should not be undefined");
    }
  });

  test("getDataObject() - should return undefined if the type is mismatched", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": true,
                "key3": []
            }
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: DataObject | undefined = getDataObject(data, "obj", "key2");
    expect(value).toBeUndefined();
    expect(getDataObject(data, "obj", "key3")).toBeUndefined();
  });

  test("getNull() - should retrieve boolean from a given path", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": null
            },
            "key3": "string"
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: boolean | undefined = getNull(data, "obj", "key2");
    expect(value).toBeTruthy();
    expect(getNull(data, "key3")).toBeFalsy();
  });

  test("getNull() - should return undefined if the given path is incorrect", () => {
    const jsonString = `
        {
            "key1": "value1",
            "obj": {
                "key2": null
            },
            "key4": "string"
        }`;
    const data = buildDataObject(jsonString) as DataObject;
    expect(data).not.toBeNull();
    const value: boolean | undefined = getNull(data, "obj", "key3");
    expect(value).toBeUndefined();
    expect(getNull(data)).toBeFalsy();
  });

  test("getDataObjectFromArray() - should return the DataObject at the given index", () => {
    const dataArray = [{ name: "Object 1" }, { name: "Object 2" }, { name: "Object 3" }];

    const result = getDataObjectFromArray(dataArray, 1);
    expect(result).toEqual({ name: "Object 2" });
  });

  test("getDataObjectFromArray() - should return undefined if the index is out of bounds", () => {
    const dataArray = [{ name: "Object 1" }, { name: "Object 2" }];

    const result1 = getDataObjectFromArray(dataArray, -1);
    expect(result1).toBeUndefined();

    const result2 = getDataObjectFromArray(dataArray, 3);
    expect(result2).toBeUndefined();
  });

  test("getDataObjectFromArray() - should return undefined if the value at the index is not a DataObject", () => {
    const dataArray = [{ name: "Object 1" }, "Not an Object", { name: "Object 3" }];

    const result = getDataObjectFromArray(dataArray, 1);
    expect(result).toBeUndefined();
  });

  test("getDataObjectFromArray() - should return undefined if dataArray is null", () => {
    const dataArray = null;

    const result = getDataObjectFromArray(dataArray, 0);
    expect(result).toBeUndefined();
  });

  test("getDataObjectFromArray() - should return undefined if dataArray is undefined", () => {
    const dataArray = undefined;

    const result = getDataObjectFromArray(dataArray, 0);
    expect(result).toBeUndefined();
  });

  test("getDataObjectFromArray() - should handle an empty array and return undefined", () => {
    const dataArray: DataArray = [];

    const result = getDataObjectFromArray(dataArray, 0);
    expect(result).toBeUndefined();
  });
});
