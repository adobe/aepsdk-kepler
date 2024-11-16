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

jest.mock('../src/platform-kepler');

import { AEPSDK } from "../src";
import { registerPlatformService } from "../src/platform-kepler";
import { configuration } from "../src/configuration";
import { _resetSDK } from '../src/initializeSDK';
import { serviceLookup } from '../src/core/services';

describe('test public APIs', () => {

    beforeEach(() => {
        _resetSDK();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('test start() should register Edge and Configuration extensions.', () => {
        // TODO: EventHub should send a shared state event includs info of the Edge and Configuration extensions.
    });

    test('test start() should call registerPlatformService().', () => {
        AEPSDK.initialize();
        expect(registerPlatformService).toBeCalled();
    });

    test('test start() should register extensions correctly.', async () => {
        const extension = {
            name: 'testExtension',
            onRegister: jest.fn(),
            version: "1.1.0",
            doSomething: jest.fn()
        }
        await AEPSDK.initialize({
            extensions: [extension]
        });
        expect(extension.onRegister).toBeCalled();
        extension.doSomething();
        expect(extension.doSomething).toBeCalled();
    });

    test('test start() should not crash if extension registration throw error', async () => {
        const extension = {
            name: 'testExtension',
            onRegister: jest.fn(() => { throw new Error('error') }),
            version: "1.1.0",
            doSomething: jest.fn()
        }
        await AEPSDK.initialize({
            extensions: [extension]
        });
        expect(extension.onRegister).toBeCalled();
        extension.doSomething();
        expect(extension.doSomething).toBeCalled();
    });

    test('test start() should pass configuration correctly.', async () => {
        jest.spyOn(configuration, 'updateConfiguration')
        await AEPSDK.initialize({
            config: {
                key: 'value'
            }
        });
        expect(configuration.updateConfiguration).toBeCalledWith({ key: 'value' });
    });

    test('test start() should set log level correctly.', async () => {
        jest.spyOn(serviceLookup.getService("logging"), 'setLogLevel')
        await AEPSDK.initialize({
            logLevel: 2
        });
        expect(serviceLookup.getService("logging").setLogLevel).toBeCalledWith(2);
    });

    test('test updateConfiguration() should register extensions correctly.', async () => {
        jest.spyOn(configuration, 'updateConfiguration')
        AEPSDK.updateConfiguration({
            key: 'value'
        });
        expect(configuration.updateConfiguration).toBeCalledWith({ key: 'value' });
    });

    test('test setLogLevel() should set log level correctly.', async () => {
        jest.spyOn(serviceLookup.getService("logging"), 'setLogLevel')
        AEPSDK.setLogLevel(3);
        expect(serviceLookup.getService("logging").setLogLevel).toBeCalledWith(3);
    });

    test('test getLogLevel() should get log level correctly.', async () => {
        jest.spyOn(serviceLookup.getService("logging"), 'getLogLevel')
        AEPSDK.getLogLevel();
        expect(serviceLookup.getService("logging").getLogLevel).toBeCalled();
    });

});