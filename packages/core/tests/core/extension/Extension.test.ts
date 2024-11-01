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
import { isExtension, Extension, ExtensionContainer } from "../../../src/core/extension";
import { ServiceLookup } from "../../../src/core/services";
describe('test isExtension() function', () => {
    test('should identify Extension objects', () => {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const extension: Extension = {
            name: "extension",
            version: "1.0.0",
            onRegister: (extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup) => { }
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

});