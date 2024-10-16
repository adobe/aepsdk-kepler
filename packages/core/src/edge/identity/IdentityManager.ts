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

import { Event } from "../../core/eventhub";
import { DataStore } from "../../core/services";
import { EdgeConstants } from "../EdgeConstants";
import { Log } from "../../core/utils/Log";

const LOG_TAG = "IdentityManager";

/**
 * IdentityManager is responsible for managing the ECID and other identity related information.
 * It is responsible for persisting and updating the ECID in the DataStore and returning the ECID and identity map.
 */
export class IdentityManager {
    private ECID_KEY = EdgeConstants.DataStoreKey.ECID;
    private ECID_NAMESPACE = EdgeConstants.IdentityMap.NameSpace.ECID;
    private dataStore: DataStore;
    private ecid: string | null = null;

    constructor(dataStore: DataStore) {
        this.dataStore = dataStore;
    }

  processEdgeResponseEvent(event: Event) {
    // TODO: process the response from the edge
    // Extract the ECID from the response
    // update the ecid value
  }

    /**
     * Returns the ECID if available
     * @returns Promise<string | null>
     */
    async getECID(): Promise<string | null> {
        Log.debug(EdgeConstants.LOG_SOURCE, LOG_TAG, `getECID() -  Getting ECID.`);
        if (this.ecid) {
            return Promise.resolve(this.ecid);
        }

        return this._getECIDFromPersistence();
    }

    /**
     * Creates and returns the identity map
     * @returns Promise<Map<string, string> | null>
     */
    async getIdentityMap(): Promise<Map<string, string> | null> {
        Log.debug(EdgeConstants.LOG_SOURCE, LOG_TAG, `getIdentityMap() -  Getting Identity Map.`);
        return this.getECID().then((ecid) => {
            if (ecid === null) {
                return Promise.resolve(null);
            }

            const identityMap = new Map([[this.ECID_NAMESPACE, ecid]]);
            return Promise.resolve(identityMap);
        });
    }

    /**
     * Updates the ECID and persists it in the DataStore.
     * If the passed value is null, then the ECID is deleted from the DataStore.
     * @param ecid string | null
     * @returns void
     */
    _updateECID(ecid: string | null) {
        Log.debug(EdgeConstants.LOG_SOURCE, LOG_TAG, `_updateECID() -  Updating ECID: (${ecid})`);

        if (ecid) {
            this.ecid = ecid;
            this._persistECID(ecid);
        } else {
            this.ecid = null;
            this._deleteECID();
        }
    }

    /**
     * Persists the ECID in the DataStore
     * @returns void
     */
    _persistECID(ecid: string) {
        Log.verbose(EdgeConstants.LOG_SOURCE, LOG_TAG, `_persistECID() -  Persisting ECID: (${ecid})`);
        this.dataStore.saveData(this.ECID_KEY, ecid);
    }

    /**
     * Deletes the ECID from the DataStore
     * @returns void
     */
    _deleteECID() {
        Log.verbose(EdgeConstants.LOG_SOURCE, LOG_TAG, `_deleteECID() -  Deleting ECID.`);
        // TODO: Add deleteKV method in the DataStore interface
        this.dataStore.saveData(this.ECID_KEY, null);
    }

    /**
     * Loads the ECID from the DataStore
     * @returns Promise<string | null>
     */
    _getECIDFromPersistence(): Promise<string | null> {
        Log.verbose(EdgeConstants.LOG_SOURCE, LOG_TAG, `_getECIDFromPersistence() -  Loading ECID from persistence.`);
        return this.dataStore.loadData(this.ECID_KEY);
    }
}
