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
import { _resetSDK } from '../src/Core';
import { serviceLookup } from '../src/core/services';
import { Extension, ExtensionContainer } from '../src/core/extension';
import { EventData } from '../src/core/eventhub';

describe('test public APIs', () => {

    beforeEach(() => {
        _resetSDK();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('test start() should call registerPlatformService().', () => {
        AEPSDK.initialize();
        expect(registerPlatformService).toBeCalled();
    });

    test('test start() should always register Edge and Configuration extensions.', async () => {

        await AEPSDK.initialize({
            extensions: [testExtension]
        });
        const sharedState = testExtension.getEventHubSharedState();

        expect(sharedState).not.toBeNull();
        expect(sharedState).toEqual({
            data: {
                version: "1.0.0",
                wrapper: {
                    type: "NONE",
                    friendlyName: "None",
                },
                extensions: [
                    {
                        name: "com.adobe.marketing.configuration",
                        version: "1.0.0",
                    },
                    {
                        name: "com.adobe.marketing.edge",
                        version: "1.0.0",
                    },
                    {
                        name: "testExtension",
                        version: "1.0",
                    },
                ],
            },
        });
    });

    test('test start() should not crash if extension registration throw error', async () => {
        const extension = {
            name: 'errorExtension',
            onRegister: jest.fn(() => { throw new Error('error') }),
            version: "1.1.0",
            doSomething: jest.fn()
        }
        await AEPSDK.initialize({
            extensions: [extension, testExtension]
        });
        expect(extension.onRegister).toBeCalled();
        extension.doSomething();
        expect(extension.doSomething).toBeCalled();

        const sharedState = testExtension.getEventHubSharedState();
        expect(sharedState).not.toBeNull();

        expect(sharedState).toEqual({
            data: {
                version: "1.0.0",
                wrapper: {
                    type: "NONE",
                    friendlyName: "None",
                },
                extensions: [
                    {
                        name: "com.adobe.marketing.configuration",
                        version: "1.0.0",
                    },
                    {
                        name: "com.adobe.marketing.edge",
                        version: "1.0.0",
                    },
                    {
                        name: "testExtension",
                        version: "1.0",
                    },
                ],
            },
        });
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


const testExtension = new (class implements Extension {
    readonly version = "1.0";
    readonly name = "testExtension";
    private container: ExtensionContainer | null = null;

    onRegister(extensionContainer: ExtensionContainer): Promise<void> {
        this.container = extensionContainer;
        return Promise.resolve();
    }
    getEventHubSharedState(): EventData | null {
        const data = this.container?.getXDMSharedState("com.adobe.module.eventhub", null)?.value;
        if (data) {
            return data;
        }
        return null;
    }
})();