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
import { Event, createEventHub } from "../../../src/core/eventhub";
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('test EventHubImpl class', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test: basic', () => {
        const eventHub = createEventHub();
        eventHub.start();

        const data_1 = new Map([["k1", "v1"]]);
        eventHub.on('type_1', 'source_1', (event: Event) => {
            expect(event.data).toEqual(data_1);
        });

        const data_2 = new Map([["k2", "v2"]]);
        eventHub.on('type_2', 'source_2', (event: Event) => {
            expect(event.data).toEqual(data_2);
        });
        eventHub.dispatchEvent(new Event('name', 'type_1', 'source_1', data_1));
        eventHub.dispatchEvent(new Event('name', 'type_2', 'source_2', data_2));
        eventHub.dispatchEvent(new Event('name', 'type_3', 'source_3'));
        eventHub.dispatchEvent(new Event('name', 'type_4', 'source_4'));
    });

    test('test: dispatch events before starting the EventHub', () => {
        const eventHub = createEventHub();

        const data_1 = new Map([["k1", "v1"]]);
        eventHub.on('type_1', 'source_1', (event: Event) => {
            expect(event.data).toEqual(data_1);
        });

        const data_2 = new Map([["k2", "v2"]]);
        eventHub.on('type_2', 'source_2', (event: Event) => {
            expect(event.data).toEqual(data_2);
        });

        eventHub.dispatchEvent(new Event('name', 'type_1', 'source_1', data_1));
        eventHub.dispatchEvent(new Event('name', 'type_2', 'source_2', data_2));
        eventHub.dispatchEvent(new Event('name', 'type_3', 'source_3'));
        eventHub.dispatchEvent(new Event('name', 'type_4', 'source_4'));

        eventHub.start();
    });

    test('test: event processor', () => {
        // We will add only one processor for rules evaluation in the future. So, we will not test multiple processors use case for now.
        const eventHub = createEventHub();

        const data = new Map([["k", "v"]]);
        const modifiedData = new Map([["new_k", "new_v"]]);

        // test
        eventHub.registerEventProcessor((event) => {
            return event.cloneWithEventData(modifiedData);
        });

        // verify
        eventHub.on('type', 'source', (event: Event) => {
            expect(event.data).toEqual(modifiedData);
        });

        // trigger
        eventHub.start();
        eventHub.dispatchEvent(new Event('name', 'type', 'source', data));
    });

});