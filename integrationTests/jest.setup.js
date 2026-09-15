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

// The suites reset the SDK per test (resetSDK) but never clear persisted storage —
// they were written against a datastore that was effectively empty each test (the
// real async-storage threw in "node", and VegaDataStore.get() swallows the error and
// returns null). The in-memory async-storage mock actually persists, so a cached ECID
// or locationHint would leak across tests (later "first request" tests would carry a
// /ee/<hint>/ path or skip the identity:result fetch). Clear it before each test to
// restore the empty-at-test-start assumption; within-test persistence still works.
const AsyncStorage = require("@react-native-async-storage/async-storage");

beforeEach(async () => {
  const impl = (AsyncStorage && AsyncStorage.default) || AsyncStorage;
  if (impl && typeof impl.clear === "function") {
    await impl.clear();
  }
});
