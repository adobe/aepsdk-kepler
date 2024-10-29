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
import { serviceLookup, registerService, DataStore } from "../../../src/core/services";
describe('test Services', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test ServiceLookup', () => {
        expect(serviceLookup.getService('dataStore')).toBeDefined();
        expect(serviceLookup.getService('logging')).toBeDefined();
    });

    test('test registerService()', () => {
        const dataStore: DataStore = {
            get: (key: string) => Promise.resolve(`key: ${key}`),
            set: jest.fn(),
            delete: jest.fn()
        };
        registerService('dataStore', dataStore);
        const retrievedDataStore = serviceLookup.getService('dataStore');
        expect(retrievedDataStore).toBeDefined();
        expect(retrievedDataStore.get('test')).resolves.toBe('key: test');
    });

});