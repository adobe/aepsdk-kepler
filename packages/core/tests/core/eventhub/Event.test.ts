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
import { Event } from "../../../src/core/eventhub";
import { EventData } from "../../../src/core/eventhub";

describe('test Event class', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test Event: constructor()', () => {
        const data = EventData.buildFrom({
            key: "value"
        });
        const event = new Event("name", "type", "source", data);

        expect(event.uuid).toBeDefined();
        expect(event.timestamp).toBeDefined();
        expect(event.id).toBe(-1);
        expect(event.name).toBe("name");
        expect(event.type).toBe("type");
        expect(event.source).toBe("source");
        expect(event.data).toEqual(data);
    });

    test('test Event: constructor() - data is null', () => {
        const event = new Event("name", "type", "source");

        expect(event.uuid).toBeDefined();
        expect(event.timestamp).toBeDefined();
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
        const data = EventData.buildFrom({
            key: "value"
        });
        const str = new Event("event_name", "event_type", "event_source", data).toString();
        // console.log(str);
        expect(str).toContain("name: event_name");
        expect(str).toContain("data: {\"key\":\"value\"}");
        expect(str).toContain("type: event_type");
        expect(str).toContain("source: event_source");
    });

    test('test Event: cloneWithEventData()', () => {
        const data = EventData.buildFrom({
            key: "value"
        });
        const event = new Event("event_name", "event_type", "event_source", data);
        const newData = EventData.buildFrom({
            key: "newValue"
        });
        const clonedEvent = event.cloneWithEventData(newData);
        expect(clonedEvent.data).toEqual(newData);
        expect(clonedEvent.id).toEqual(event.id);
        expect(clonedEvent.name).toEqual(event.name);
        expect(clonedEvent.type).toEqual(event.type);
        expect(clonedEvent.source).toEqual(event.source);
        expect(clonedEvent.timestamp).toEqual(event.timestamp);
    });

});