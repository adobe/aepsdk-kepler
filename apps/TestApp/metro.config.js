/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { resolve, join } = require('path');

/**
+ * Metro configuration
+ * https://facebook.github.io/metro/docs/configuration
 *
+ * @type {import('metro-config').MetroConfig}
 */

const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [
    resolve(__dirname, '../../packages'),
    resolve(__dirname, '../../node_modules')
  ],
  resolver: {
    nodeModulesPaths: [
      resolve(__dirname, 'node_modules'),
      resolve(__dirname, '../../node_modules')
    ],
    extraNodeModules: new Proxy(
      {},
      {
        get: (target, name) => {
          if (typeof name !== 'string') {
            return target[name];
          }
          if (
            name &&
            name.startsWith &&
            name.startsWith('@adobe/kepler-aep')
          ) {
            const packageName = name.replace('@adobe/kepler-aep', '');
            console.log('------packageName -> ' + packageName);
            return resolve(__dirname, `../../packages/${packageName}`);
          }
          // For all other modules, check root node_modules first
          return resolve(__dirname, `../../node_modules/${name}`);
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
