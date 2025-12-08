/*
 * Copyright (c) 2022 Amazon.com, Inc. or its affiliates.  All rights reserved.
 *
 * PROPRIETARY/CONFIDENTIAL.  USE IS SUBJECT TO LICENSE TERMS.
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
