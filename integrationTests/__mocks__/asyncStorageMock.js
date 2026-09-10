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

// In-memory stand-in for @react-native-async-storage/async-storage.
// Integration tests run under jest's "node" testEnvironment where `window` is
// undefined; the real async-storage web fallback dereferences `window` and throws
// "window is not defined" on every VegaDataStore access. On-device the native
// backend is present. This map-backed impl lets persistence behave (ECID /
// stateStore / locationHint survive across Edge requests within a run).
const store = new Map();

const impl = {
  getItem: (key) => Promise.resolve(store.has(key) ? store.get(key) : null),
  setItem: (key, value) => {
    store.set(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    store.delete(key);
    return Promise.resolve();
  },
  clear: () => {
    store.clear();
    return Promise.resolve();
  },
  getAllKeys: () => Promise.resolve([...store.keys()]),
  multiGet: (keys) =>
    Promise.resolve(keys.map((k) => [k, store.has(k) ? store.get(k) : null])),
  multiSet: (pairs) => {
    pairs.forEach(([k, v]) => store.set(k, v));
    return Promise.resolve();
  },
  multiRemove: (keys) => {
    keys.forEach((k) => store.delete(k));
    return Promise.resolve();
  },
};

module.exports = { __esModule: true, default: impl, ...impl };
