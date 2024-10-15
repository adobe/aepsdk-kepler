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
import { buildSharedStateEvent, SharedStateManager, SharedStateStatus } from "../../../src/core/sharedstate";
/* eslint-disable @typescript-eslint/no-explicit-any */
describe('test SharedState related classes', () => {

    beforeEach(() => { });

    afterEach(() => { });

    test('test buildSharedStateEvent()', () => {
        const event = buildSharedStateEvent('extensionName1');
        expect(event).toBeDefined();
        expect(event.name).toBe('Shared state change (XDM)');
        expect(event.type).toBe('com.adobe.eventType.hub');
        expect(event.source).toBe('com.adobe.eventSource.sharedState');
        const data = event.data as Map<string, any>;
        expect(data).toBeDefined();
        expect(data.get('stateowner')).toBe('extensionName1');
    });

    test('test SharedStateManager - set and get state', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 100, new Map([['key', 'value']]), SharedStateStatus.SET);
        const state1 = manager.getSharedState('extensionName1', 100);
        const state2 = manager.getSharedState('extensionName1', 101);
        const state3 = manager.getSharedState('extensionName1', 200);
        const state4 = manager.getSharedState('extensionName1', 99);

        expect(state1).toBeDefined();
        expect(state2).toBeDefined();
        expect(state3).toBeDefined();
        expect(state4).toBeDefined();

        expect(state1).toEqual(state2);
        expect(state2).toEqual(state3);
        expect(state3).toEqual(state4);
    });

    test('test SharedStateManager - clear state', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 100, null, SharedStateStatus.PENDING);
        manager.removeSharedState('extensionName1', 100);
        const state = manager.getSharedState('extensionName1', 100);
        expect(state).toBeNull();
    });

    test('test SharedStateManager - get state for non-existent extension', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 100, new Map([['key', 'value']]), SharedStateStatus.SET);
        const state = manager.getSharedState('extensionName2', 100);
        expect(state).toBeNull();
    });

    test('test SharedStateManager - always get the valid state (1)', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 50, new Map([['key1', 'value1']]), SharedStateStatus.SET);
        manager.updateSharedState('extensionName1', 100, new Map([['key2', 'value2']]), SharedStateStatus.SET);
        manager.updateSharedState('extensionName1', 200, null, SharedStateStatus.PENDING);

        const state = manager.getSharedState('extensionName1', 300);
        expect(state).toBeDefined();
        expect(state?.status).toBe(SharedStateStatus.SET);
        expect(state?.value).toEqual(new Map([['key2', 'value2']]));
    });

    test('test SharedStateManager - always get the valid state (2)', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 50, new Map([['key1', 'value1']]), SharedStateStatus.SET);
        manager.updateSharedState('extensionName1', 100, new Map([['key2', 'value2']]), SharedStateStatus.SET);
        manager.updateSharedState('extensionName1', 150, null, SharedStateStatus.PENDING);
        manager.updateSharedState('extensionName1', 200, null, SharedStateStatus.PENDING);

        const state = manager.getSharedState('extensionName1', 300);
        expect(state).toBeDefined();
        expect(state?.status).toBe(SharedStateStatus.SET);
        expect(state?.value).toEqual(new Map([['key2', 'value2']]));
    });

    test('test SharedStateManager - always get the valid state (3)', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 100, null, SharedStateStatus.PENDING);
        manager.updateSharedState('extensionName1', 200, null, SharedStateStatus.PENDING);
        manager.updateSharedState('extensionName1', 300, new Map([['key1', 'value1']]), SharedStateStatus.SET);
        manager.updateSharedState('extensionName1', 400, new Map([['key2', 'value2']]), SharedStateStatus.SET);

        const state = manager.getSharedState('extensionName1', 200);
        expect(state).toBeDefined();
        expect(state?.status).toBe(SharedStateStatus.SET);
        expect(state?.value).toEqual(new Map([['key1', 'value1']]));
    });

    test('test SharedStateManager - get PENDING state', () => {
        const manager = new SharedStateManager();
        manager.updateSharedState('extensionName1', 100, null, SharedStateStatus.PENDING);
        manager.updateSharedState('extensionName1', 200, null, SharedStateStatus.PENDING);
        const state = manager.getSharedState('extensionName1', 300);
        expect(state).toBeDefined();
        expect(state?.status).toBe(SharedStateStatus.PENDING);
    });

});