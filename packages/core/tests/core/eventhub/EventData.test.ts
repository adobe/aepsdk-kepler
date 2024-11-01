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
import { EventData, DataType, DataValue, DataArray } from "../../../src/core/eventhub/EventData";
describe('test EventData class', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('buildFrom() - should build an EventData object, if the input is the standard JSON object', () => {
        const jsonObj = {
            str: 'value',
            num: 1,
            bool: true,
            nil: null,
            arr: [
                'value',
                1,
                true,
                null,
                {
                    key: 'value',
                }
            ],
            obj: {
                str: 'value',
                arr: [
                    'value',
                    {
                        key: 'value',
                    }
                ],
                // nested object
                obj: {
                    key: 'value',
                }
            },
        }
        const data = EventData.buildFrom(jsonObj);
        if (data === null) {
            fail('EventData object should not be null');
        }
        // console.log(`${data}`);
        // {"str":"value","num":1,"bool":true,"nil":null,"arr":["value",1,true,null,{"key":"value"}],"obj":{"str":"value","arr":["value",{"key":"value"}],"obj":{"key":"value"}}}
        expect(data.toString()).toEqual(JSON.stringify(jsonObj));
    });

    test('buildFrom() - should omit unsupported values when building the EventData object ', () => {
        const dateObj = new Date();
        const jsonObj = {
            key: "value",
            dateKey: dateObj,
            fn: () => { },
            map: new Map([
                ["key1", "value"],
                ["key2", "value"]]),
            symbol: Symbol("foo"),
            undefinedKey: undefined,
        }
        // console.log(JSON.stringify(jsonObj));
        const data = EventData.buildFrom(jsonObj);
        if (data === null) {
            fail('EventData object should not be null');
        }
        // console.log(`${data}`);
        // {"key":"value","dateKey":"2024-10-29T03:39:21.269Z"}
        expect(data.toString().includes("symbol")).toBeFalsy();
        expect(data.toString().includes("map")).toBeFalsy();
        expect(data.toString().includes("fn")).toBeFalsy();
        expect(data.toString().includes("undefinedKey")).toBeFalsy();
        expect(data.toString().includes("dateKey")).toBeTruthy();
    });

    test('buildFrom() -  should return null when builing the EventData object, if the input includes circular reference ', () => {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
        const circularReference = {
            myself: null as any,
        };
        circularReference.myself = circularReference;
        const data = EventData.buildFrom(circularReference);
        expect(data).toBeNull();
    });

    test('buildFrom() - should return null when builing the EventData object, if the input includes BigInt', () => {
        //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#exceptions
        const jsonObj = {
            key: BigInt(9007199254740991),
        }
        const data = EventData.buildFrom(jsonObj);
        expect(data).toBeNull();
    });

    test('clone() - should clone a new object ', () => {
        const jsonObj = {
            key: "value",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const clonedData = data.clone();
        expect(data.toString()).toEqual(clonedData.toString());
        clonedData.updateData(["key"], "newValue");
        expect(clonedData.toString().includes("newValue")).toBeTruthy();
        expect(data.toString().includes("newValue")).toBeFalsy();
    });

    test('retrieveStringFromPath() - should retrieve string from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: "value2",
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: string | undefined = data.retrieveStringFromPath("obj", "key2");
        expect(value).toEqual("value2");
        expect(data.retrieveStringFromPath("key1")).toEqual("value1");
    });

    test('retrieveStringFromPath() - should return undefined if the given path is incorrect', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: "value2",
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        expect(data.retrieveStringFromPath("obj", "key3")).toBeUndefined();
        expect(data.retrieveStringFromPath("obj1")).toBeUndefined();
        expect(data.retrieveStringFromPath()).toBeUndefined();
    });

    test('retrieveStringFromPath() - should return undefined if the type is mismatched', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: "value2",
                key3: 1234,
            },
            key4: true,
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        expect(data.retrieveStringFromPath("obj", "key3")).toBeUndefined();
        expect(data.retrieveStringFromPath("key4")).toBeUndefined();
    });

    test('retrieveNumberFromPath() - should retrieve number from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: ["value2", "value3"],
                numberKey: 1234,
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: number | undefined = data.retrieveNumberFromPath("obj", "numberKey");
        if (value === undefined) {
            fail("value should not be undefined");
        }
        expect(value).toEqual(1234);
    });

    test('retrieveNumberFromPath() - should return undefined if the type is mismatched', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: ["value2", "value3"],
                numberKey: 1234,
            },
            key3: "string",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: number | undefined = data.retrieveNumberFromPath("obj", "key2");
        expect(value).toBeUndefined();
        expect(data.retrieveNumberFromPath("obj", "key3")).toBeUndefined();
    });

    test('retrieveArrayFromPath() - should retrieve Array from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: ["value2", "value3"],
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: DataArray | undefined = data.retrieveArrayFromPath("obj", "key2");
        if (value === undefined) {
            fail("value should not be undefined");
        }
        expect(value[0]).toEqual("value2");
        expect(value[1]).toEqual("value3");
        expect(data.retrieveArrayFromPath()).toBeUndefined();
    });

    test('retrieveArrayFromPath() - should return undefined if the type is mismatched', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: ["value2", "value3"],
                key3: 1234,
            },
            key3: "string",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: DataArray | undefined = data.retrieveArrayFromPath("obj", "key3");
        expect(value).toBeUndefined();
        expect(data.retrieveArrayFromPath("key4")).toBeUndefined();
    });

    test('retrieveBooleanFromPath() - should retrieve boolean from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: true,
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: boolean | undefined = data.retrieveBooleanFromPath("obj", "key2");
        if (value === undefined) {
            fail("value should not be undefined");
        }
        expect(value).toBeTruthy();
    });

    test('retrieveBooleanFromPath() - should return undefined if the type is mismatched', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: true,
                key3: 1234,
            },
            key4: "string",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: boolean | undefined = data.retrieveBooleanFromPath("obj", "key3");
        expect(value).toBeUndefined();
        expect(data.retrieveBooleanFromPath("key4")).toBeUndefined();
        expect(data.retrieveBooleanFromPath()).toBeUndefined();
    });

    test('retrieveDataTypeFromPath() - should retrieve DataType from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: {
                    key3: "value3",
                },
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: DataType | undefined = data.retrieveDataTypeFromPath("obj", "key2");
        if (value === undefined) {
            fail("value should not be undefined");
        }
        expect(value).toEqual({ key3: "value3" });
    });

    test('retrieveDataTypeFromPath() - should retrieve the data root if the path is empty', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: {
                    key3: "value3",
                },
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: DataType | undefined = data.retrieveDataTypeFromPath();
        if (value === undefined) {
            fail("value should not be undefined");
        }
        expect(value).toEqual(jsonObj);
    });

    test('retrieveDataTypeFromPath() - should return undefined if the type is mismatched', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: true,
                key3: [],
            }
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: DataType | undefined = data.retrieveDataTypeFromPath("obj", "key2");
        expect(value).toBeUndefined();
        expect(data.retrieveDataTypeFromPath("obj", "key3")).toBeUndefined();
    });

    test('isNull() - should retrieve boolean from a given path', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: null,
            },
            key3: "string",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: boolean | undefined = data.isNull("obj", "key2");
        expect(value).toBeTruthy();
        expect(data.isNull("key3")).toBeFalsy();
    });

    test('isNull() - should return undefined if the given path is incorrect', () => {
        const jsonObj = {
            key1: "value1",
            obj: {
                key2: null,
                // key3: 1234,
            },
            key4: "string",
        }
        const data = EventData.buildFrom(jsonObj) as EventData;
        const value: boolean | undefined = data.isNull("obj", "key3");
        expect(value).toBeUndefined();
        expect(data.isNull()).toBeFalsy();
    });

    test('updateData() - should add data to the right place - basic', () => {
        const jsonObj = {
            key: "value",
            obj: {
                key: "value",
            }
        }
        const data = (EventData.buildFrom(jsonObj) as EventData).clone();
        data.updateData(["obj", "newKey"], "newValue");
        expect(data.retrieveStringFromPath("obj", "newKey")).toEqual("newValue");
        data.updateData(["newKey"], "newValue");
        expect(data.retrieveStringFromPath("newKey")).toEqual("newValue");
    });

    test('updateData() - should add data to the right place - update existing data', () => {
        const jsonObj = {
            key: "value",
            obj: {
                key: "value",
            }
        }
        const data = (EventData.buildFrom(jsonObj) as EventData).clone();
        data.updateData(["obj", "key"], "newValue");
        expect(data.retrieveStringFromPath("obj", "key")).toEqual("newValue");
        data.updateData(["key"], "newValue");
        expect(data.retrieveStringFromPath("key")).toEqual("newValue");
    });

    test('updateData() - should add data to the right place - create an empty parent object', () => {
        const jsonObj = {
            key: "value",
            obj: {
                key: "value",
            }
        }
        const data = (EventData.buildFrom(jsonObj) as EventData).clone();
        data.updateData(["obj", "emptyParent", "newKey"], "newValue");
        expect(data.retrieveStringFromPath("obj", "emptyParent", "newKey")).toEqual("newValue");
        data.updateData(["emptyParent", "newKey"], "newValue");
        expect(data.retrieveStringFromPath("emptyParent", "newKey")).toEqual("newValue");
    });

});