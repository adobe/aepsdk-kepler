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
import { EventListener, EventData, Event } from "../../../src/core/eventhub";
import { isExtension, Extension, ExtensionContainer, SharedStateResolver } from "../../../src/core/extension";
import { ServiceLookup } from "../../../src/core/services";
import { SharedStateResult } from "../../../src/core/sharedstate";
describe('test Extension', () => {
    test('isExtension()() - should identify Extension objects', () => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const extension: Extension = {
            name: "extension",
            version: "1.0.0",
            onRegister: async (extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup) => { }
        };

        expect(isExtension(extension)).toBeTruthy();

        const notAnExtension1 = {
            name: "not an extension",
            version: "1.0.0"
        };

        const notAnExtension2 = {
            name: "not an extension",
            version: "1.0.0",
            onRegister: "not a function"
        };

        expect(isExtension(notAnExtension1)).toBeFalsy();
        expect(isExtension(notAnExtension2)).toBeFalsy();
    });

    test('onRegister() - should be able to do some aync operations', async () => {
        const extensionContainer: ExtensionContainer = {
            registerEventListener: function (eventType: string, eventSource: string, listener: EventListener): void {
                throw new Error("Function not implemented.");
            },
            createXDMSharedState: function (state: EventData, event: Event | null): void {
                throw new Error("Function not implemented.");
            },
            createPendingXDMSharedState: function (event: Event | null): Promise<SharedStateResolver> {
                throw new Error("Function not implemented.");
            },
            getXDMSharedState: function (extensionName: string, event: Event | null): SharedStateResult | null {
                throw new Error("Function not implemented.");
            },
            dispatch: function (event: Event): void {
                throw new Error("Function not implemented.");
            }
        }
        const serviceLookup: ServiceLookup = {
            getService: function (name: string) {
                throw new Error("Function not implemented.");
            }
        }
        const flags: string[] = [];
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const extension1: Extension = {
            name: "extension1",
            version: "1.0.0",
            onRegister: async (extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup) => {
                return new Promise<void>((resolve) => {
                    setTimeout(() => {
                        flags.push("extension1");
                        resolve();
                    }, 100);
                });
            }
        };
        const extension2: Extension = {
            name: "extension2",
            version: "1.0.0",
            onRegister: async (extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup) => {
                return new Promise<void>((resolve) => {
                    setTimeout(() => {
                        flags.push("extension2");
                        resolve();
                    }, 100);
                });
            }
        };

        await extension1.onRegister(extensionContainer, serviceLookup);
        await extension2.onRegister(extensionContainer, serviceLookup);
        expect(flags).toEqual(["extension1", "extension2"]);
    });

});