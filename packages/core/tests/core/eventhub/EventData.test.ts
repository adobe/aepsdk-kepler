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
import { EventData, DataObject, DataArray } from "../../../src/core/eventhub/EventData";
describe("test EventData class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("buildFrom() - should build an EventData object, if the input is the standard JSON object", () => {
    const jsonObj = {
      str: "value",
      num: 1,
      bool: true,
      nil: null,
      arr: [
        "value",
        1,
        true,
        null,
        {
          key: "value",
        },
      ],
      obj: {
        str: "value",
        arr: [
          "value",
          {
            key: "value",
          },
        ],
        // nested object
        obj: {
          key: "value",
        },
      },
    };
    const eventData = EventData.buildFrom(jsonObj);
    expect(eventData?.getData() ?? {}).toEqual(jsonObj);
    // console.log(`${data}`);
    // {"str":"value","num":1,"bool":true,"nil":null,"arr":["value",1,true,null,{"key":"value"}],"obj":{"str":"value","arr":["value",{"key":"value"}],"obj":{"key":"value"}}}
    expect(eventData?.toString()).toEqual(JSON.stringify(jsonObj));
  });

  test("buildFrom() - should omit unsupported values when building the EventData object ", () => {
    const dateObj = new Date();
    const jsonObj = {
      key: "value",
      dateKey: dateObj,
      fn: () => {},
      map: new Map([
        ["key1", "value"],
        ["key2", "value"],
      ]),
      symbol: Symbol("foo"),
      undefinedKey: undefined,
    };
    // console.log(JSON.stringify(jsonObj));
    const data = EventData.buildFrom(jsonObj);
    if (!data) {
      fail("EventData object should not be null");
    }
    // console.log(`${data}`);
    // {"key":"value","dateKey":"2024-10-29T03:39:21.269Z"}
    expect(Object.keys(JSON.parse(data.toString()))).toEqual(["key", "dateKey"]);
  });

  test("buildFrom() -  should return null when builing the EventData object, if the input includes circular reference ", () => {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
    const circularReference = {
      myself: null as unknown,
    };
    circularReference.myself = circularReference;
    const data = EventData.buildFrom(circularReference);
    expect(data).toBeNull();
  });

  test("buildFrom() - should return null when builing the EventData object, if the input includes BigInt", () => {
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
    const jsonObj = {
      key: BigInt(9007199254740991),
    };
    const data = EventData.buildFrom(jsonObj);
    expect(data).toBeNull();
  });

  test("clone() - should clone a new object ", () => {
    const jsonObj = {
      key: "value",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const clonedData = data.clone();
    expect(data === clonedData).toBeFalsy();
    expect(data.toString()).toEqual(clonedData.toString());
    clonedData.updateData(["key"], "newValue");
    expect(clonedData.toString().includes("newValue")).toBeTruthy();
    expect(data.toString().includes("newValue")).toBeFalsy();
  });

  test("getData() - should return the deep copy of the data object", () => {
    const jsonObj = {
      key1: "value",
      key2: 1,
      key3: true,
      key4: null,
      key5: {
        key6: "value",
      },
      key7: ["value1", "value2"],
    };

    const eventData = EventData.buildFrom(jsonObj) as EventData;
    const deepCopy = eventData.getData();
    expect(deepCopy).toEqual(jsonObj);
    expect(deepCopy === jsonObj).toBeFalsy();

    // modify the data object should not mutate the deep copy, and vice versa
    eventData.updateData(["key1"], "newValue");
    delete deepCopy!["key5"];

    expect(eventData.getString("key1")).toEqual("newValue");
    expect(deepCopy!["key1"]).toEqual("value");

    expect(deepCopy!["key5"]).toBeUndefined();
    expect(eventData.getDataObject("key5")).toEqual({ key6: "value" });
  });

  test("getString() - should retrieve string from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: "value2",
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: string | undefined = data.getString("obj", "key2");
    expect(value).toEqual("value2");
    expect(data.getString("key1")).toEqual("value1");
  });

  test("getString() - should return undefined if the given path is incorrect", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: "value2",
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    expect(data.getString("obj", "key3")).toBeUndefined();
    expect(data.getString("obj1")).toBeUndefined();
    expect(data.getString()).toBeUndefined();
  });

  test("getString() - should return undefined if the type is mismatched", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: "value2",
        key3: 1234,
      },
      key4: true,
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    expect(data.getString("obj", "key3")).toBeUndefined();
    expect(data.getString("key4")).toBeUndefined();
  });

  test("getNumber() - should retrieve number from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: ["value2", "value3"],
        numberKey: 1234,
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: number | undefined = data.getNumber("obj", "numberKey");
    expect(value).not.toBeUndefined();
    expect(value).toEqual(1234);
  });

  test("getNumber() - should return undefined if the type is mismatched", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: ["value2", "value3"],
        numberKey: 1234,
      },
      key3: "string",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: number | undefined = data.getNumber("obj", "key2");
    expect(value).toBeUndefined();
    expect(data.getNumber("obj", "key3")).toBeUndefined();
  });

  test("getArray() - should retrieve Array from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: ["value2", "value3"],
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: DataArray | undefined = data.getArray("obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value[0]).toEqual("value2");
    expect(value[1]).toEqual("value3");
    expect(data.getArray()).toBeUndefined();
  });

  test("getArray() - should return undefined if the type is mismatched", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: ["value2", "value3"],
        key3: 1234,
      },
      key3: "string",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: DataArray | undefined = data.getArray("obj", "key3");
    expect(value).toBeUndefined();
    expect(data.getArray("key4")).toBeUndefined();
  });

  test("getBoolean() - should retrieve boolean from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: true,
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: boolean | undefined = data.getBoolean("obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value).toBeTruthy();
  });

  test("getBoolean() - should return undefined if the type is mismatched", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: true,
        key3: 1234,
      },
      key4: "string",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: boolean | undefined = data.getBoolean("obj", "key3");
    expect(value).toBeUndefined();
    expect(data.getBoolean("key4")).toBeUndefined();
    expect(data.getBoolean()).toBeUndefined();
  });

  test("getDataObject() - should retrieve DataObject from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: {
          key3: "value3",
        },
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: DataObject | undefined = data.getDataObject("obj", "key2");
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value).toEqual({ key3: "value3" });
  });

  test("getDataObject() - should retrieve the data root if the path is empty", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: {
          key3: "value3",
        },
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: DataObject | undefined = data.getDataObject();
    if (value === undefined) {
      fail("value should not be undefined");
    }
    expect(value).toEqual(jsonObj);
  });

  test("getDataObject() - should return undefined if the type is mismatched", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: true,
        key3: [],
      },
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: DataObject | undefined = data.getDataObject("obj", "key2");
    expect(value).toBeUndefined();
    expect(data.getDataObject("obj", "key3")).toBeUndefined();
  });

  test("getNull() - should retrieve boolean from a given path", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: null,
      },
      key3: "string",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: boolean | undefined = data.getNull("obj", "key2");
    expect(value).toBeTruthy();
    expect(data.getNull("key3")).toBeFalsy();
  });

  test("getNull() - should return undefined if the given path is incorrect", () => {
    const jsonObj = {
      key1: "value1",
      obj: {
        key2: null,
        // key3: 1234,
      },
      key4: "string",
    };
    const data = EventData.buildFrom(jsonObj) as EventData;
    const value: boolean | undefined = data.getNull("obj", "key3");
    expect(value).toBeUndefined();
    expect(data.getNull()).toBeFalsy();
  });

  test("updateData() - should add data to the right place - basic", () => {
    const jsonObj = {
      key: "value",
      obj: {
        key: "value",
      },
    };
    const data = (EventData.buildFrom(jsonObj) as EventData).clone();
    data.updateData(["obj", "newKey"], "newValue");
    expect(data.getString("obj", "newKey")).toEqual("newValue");
    data.updateData(["newKey"], "newValue");
    expect(data.getString("newKey")).toEqual("newValue");
  });

  test("updateData() - should add data to the right place - update existing data", () => {
    const jsonObj = {
      key: "value",
      obj: {
        key: "value",
      },
    };
    const data = (EventData.buildFrom(jsonObj) as EventData).clone();
    data.updateData(["obj", "key"], "newValue");
    expect(data.getString("obj", "key")).toEqual("newValue");
    data.updateData(["key"], "newValue");
    expect(data.getString("key")).toEqual("newValue");
  });

  test("updateData() - should add data to the right place - create an empty parent object", () => {
    const jsonObj = {
      key: "value",
      obj: {
        key: "value",
      },
    };
    const data = (EventData.buildFrom(jsonObj) as EventData).clone();
    data.updateData(["obj", "emptyParent", "newKey"], "newValue");
    expect(data.getString("obj", "emptyParent", "newKey")).toEqual("newValue");
    data.updateData(["emptyParent", "newKey"], "newValue");
    expect(data.getString("emptyParent", "newKey")).toEqual("newValue");
  });
});
test("removeData() - should remove the specified key from the data", () => {
  const jsonObj = {
    key1: "value1",
    key2: "value2",
  };
  const data = EventData.buildFrom(jsonObj) as EventData;
  data.removeData("key1");

  expect(data.getString("key1")).toBeUndefined();
  expect(data.getString("key2")).toEqual("value2");
});

test("removeData() - should do nothing if the key does not exist", () => {
  const jsonObj = {
    key1: "value1",
    key2: "value2",
  };
  const data = EventData.buildFrom(jsonObj) as EventData;
  data.removeData("key3");
  expect(data.getString("key1")).toEqual("value1");
  expect(data.getString("key2")).toEqual("value2");
});

test("removeData() - should remove nested keys correctly", () => {
  const jsonObj = {
    key1: {
      nestedKey1: "nestedValue1",
      nestedKey2: "nestedValue2",
    },
    key2: "value2",
  };
  const data = EventData.buildFrom(jsonObj) as EventData;
  data.removeData("key1", "nestedKey1");
  expect(data.getString("key1", "nestedKey1")).toBeUndefined();
  expect(data.getString("key1", "nestedKey2")).toEqual("nestedValue2");
  expect(data.getString("key2")).toEqual("value2");
});

test("removeData() - should handle removing keys from an empty object", () => {
  const jsonObj = {};
  const data = EventData.buildFrom(jsonObj) as EventData;
  data.removeData("key1");
  expect(data.getString("key1")).toBeUndefined();
});
