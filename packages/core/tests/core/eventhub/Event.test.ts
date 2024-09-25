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
import { Event, _cloneEventData } from "../../../src/core/eventhub";
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('test Event class', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test utility function: _cloneEventData()', () => {
        const data = new Map<string, any>();
        data.set("key1", "value1");
        data.set("key2", 123);
        data.set("key3", {
            "nest_obj_key_1": "value2",
            "nest_obj_key_2": {
                "nest_obj_key_2_1": "value3",
                "nest_obj_key_2_2": 456,
            },
        });
        const clonedData = _cloneEventData(data);

        // verify the basic clone behavior
        data.delete("key1");
        expect(clonedData.get("key1")).toEqual("value1");

        // verify the nest data
        expect(clonedData.get("key3")).toEqual({
            "nest_obj_key_1": "value2",
            "nest_obj_key_2": {
                "nest_obj_key_2_1": "value3",
                "nest_obj_key_2_2": 456,
            },
        });
    });

    test('test Event: constructor()', () => {
        const data = new Map<string, any>();
        data.set("key", "value");
        const event = new Event("name", "type", "source", data);

        expect(event.uuid).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.id).toBe(-1);
        expect(event.name).toBe("name");
        expect(event.type).toBe("type");
        expect(event.source).toBe("source");
        expect(event.data).toEqual(data);
    });

    test('test Event: constructor() with null data map', () => {
        const event = new Event("name", "type", "source");

        expect(event.uuid).toBeDefined();
        expect(event.id).toBe(-1);
        expect(event.name).toBe("name");
        expect(event.type).toBe("type");
        expect(event.source).toBe("source");
        expect(event.data).toBeNull();
    });

    test('test Event: id should only be set once', () => {
        const event = new Event("name", "type", "source");

        expect(event.id).toBe(-1);

        event.id = 1;

        expect(event.id).toBe(1);

        event.id = 2;

        expect(event.id).toBe(1);
    });

    test('test Event: toString()', () => {
        const str = new Event("event_name", "event_type", "event_source", new Map([["k", "v"]])).toString();
        // console.log(str);
        expect(str).toContain("name: event_name");
        expect(str).toContain(`data: [["k","v"]]`);
        expect(str).toContain("type: event_type");
        expect(str).toContain("source: event_source");
    });

    test('test Event: cloneWithEventData()', () => {
        const event = new Event("event_name", "event_type", "event_source", new Map([["k", "v"]]));
        const clonedEvent = event.cloneWithEventData(new Map([["k2", "v2"]]))
        expect(clonedEvent.data).toEqual(new Map([["k2", "v2"]]));
    });

});