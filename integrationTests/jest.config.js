/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const baseConfig = require("../jest.config");

module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        // Integration tests run under a "node" env with no `window`; the real
        // async-storage web fallback throws "window is not defined". Map it to an
        // in-memory stand-in so VegaDataStore persistence works off-device.
        "^@react-native-async-storage/async-storage$": "<rootDir>/__mocks__/asyncStorageMock.js",
    },
    coverageThreshold: {
        global: {
            branches: 42,
            functions: 58,
            lines: 65,
            statements: 68,
        },
    },
};