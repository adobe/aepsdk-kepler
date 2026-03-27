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

import { VegaDataStore } from '@adobe/vega-aepcore/src/platform-kepler/DataStore';

export async function clearDatastore() {
    const keplerDataStore = new VegaDataStore();

        console.log('#clearDatastore() - Clearing Datastore');
        const sdk_keys = [
          'edge.ecid',
          'edge.consent.collect',
          'edge.locationHint',
          'edge.stateStore',
        ]

        for (const key of sdk_keys) {
          console.log(`#clearDatastore() - Deleting key: ${key}`);
          await keplerDataStore.delete(key);
        }
}
