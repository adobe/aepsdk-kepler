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

import { DataStore } from "../../core/services";
import { EdgeConstants } from "../EdgeConstants";
import { Log } from "../../core/utils/Log";
import { DataObject, DataType, EventData } from "../../core/eventhub/EventData";
import { isNullOrEmptyString } from "../../core/utils/StringUtil";
import { Event } from "../../core/eventhub/Event";
import { EventType, EventSource } from "../../core/eventhub";
import { getArray, getString } from "../../core/utils/DataObjectUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "IdentityManager";

const RESPONSE_DATA_KEYS = EdgeConstants.ResponseData.Keys;

/**
 * IdentityManager is responsible for managing the ECID and other identity related information.
 * It is responsible for persisting and updating the ECID in the DataStore and returning the ECID and identity map.
 */
export class IdentityManager {
  private ECID_KEY = EdgeConstants.DataStoreKey.ECID;
  private ECID_NAMESPACE = EdgeConstants.IdentityMap.NameSpace.ECID;
  private ecid: string | null = null;

  constructor(private dataStore: DataStore, private dispatchFn: (event: Event) => void) {}

  /**
   * Boots up the IdentityManager and loads the ECID from the DataStore.
   * @returns Promise<void>
   */
  async bootup(): Promise<void> {
    Log.debug(LOG_SOURCE, LOG_TAG, `bootup() -  Booting up IdentityManager.`);
    this.ecid = await this.getECIDFromPersistence();
    Promise.resolve();
  }

  /**
   * Processes the Edge response and updates the ECID if available.
   * @param responseHandle The response handle containing the identity payload.
   */
  processEdgeResponse(responseHandle: DataObject) {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processEdgeResponse() -  Processing Edge Response handle:(${JSON.stringify(
        responseHandle
      )}).`
    );

    const payloadArray = getArray(responseHandle, RESPONSE_DATA_KEYS.PAYLOAD) ?? [];

    for (const payload of payloadArray) {
      const code =
        getString(payload as DataObject, RESPONSE_DATA_KEYS.NAMESPACE, RESPONSE_DATA_KEYS.CODE) ??
        "";
      //const code = (namespace?.["code"] as string) ?? "";

      if (code === this.ECID_NAMESPACE) {
        const ecid = getString(payload as DataObject, RESPONSE_DATA_KEYS.ID) ?? "";
        //const ecid = payloadObj["id"] as string;
        if (!isNullOrEmptyString(ecid)) {
          this.updateECID(ecid);
          // TODO: createSharedState update instead of dispatching event
          this.dispatchECID(ecid);
        }
      }
    }
  }

  /**
   * Dispatches the ECID to the event hub
   */
  dispatchECID(ecid: string) {
    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `dispatchECID() -  Dispatching Identity Response Event with ecid:(${ecid})`
    );

    if (!isNullOrEmptyString(ecid)) {
      const eventData = EventData.buildFrom({
        [EdgeConstants.EventData.Keys.ECID]: ecid,
      });
      const event = new Event(
        "Edge Identity Response",
        EventType.EDGE_IDENTITY,
        EventSource.RESPONSE_IDENTITY,
        eventData
      );
      this.dispatchFn(event);
    }
  }

  /**
   * Returns the ECID if available, else returns null.
   * @returns string | null
   */
  getECID(): string | null {
    Log.debug(LOG_SOURCE, LOG_TAG, `getECID() -  Returning ECID from cache: (${this.ecid})`);
    return this.ecid;
  }

  /**
   * Creates and returns the identity map
   * @returns Promise<Record<string, DataType> | null>
   */
  getIdentityMap(): DataObject | null {
    Log.debug(LOG_SOURCE, LOG_TAG, `getIdentityMap() -  Getting Identity Map.`);

    if (!isNullOrEmptyString(this.ecid)) {
      const identityMap: Record<string, DataType> = {};
      identityMap[this.ECID_NAMESPACE] = [
        {
          id: this.ecid,
          primary: true,
          authenticatedState: "ambiguous",
        },
      ];

      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `getIdentityMap() -  Returning Identity Map: (${identityMap})`
      );
      return identityMap;
    }
    return null;
  }

  /**
   * Updates the ECID and persists it in the DataStore.
   * If the passed value is null, then the ECID is deleted from the DataStore.
   * @param ecid string | null
   * @returns void
   */
  updateECID(ecid: string | null) {
    Log.debug(LOG_SOURCE, LOG_TAG, `_updateECID() -  Updating ECID: (${ecid})`);

    if (isNullOrEmptyString(ecid)) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `_updateECID() -  Deleting ECID, since the value:(${ecid}) is null or empty.`
      );
      this.ecid = null;
      this.deleteECID();
    } else {
      Log.verbose(LOG_SOURCE, LOG_TAG, `_updateECID() -  Updating ECID with value: (${ecid})`);
      this.ecid = ecid;
      this.persistECID(ecid!);
    }
  }

  /**
   * Persists the ECID in the DataStore
   * @returns void
   */
  private persistECID(ecid: string) {
    Log.verbose(LOG_SOURCE, LOG_TAG, `persistECID() -  Persisting ECID: (${ecid})`);
    this.dataStore.set(this.ECID_KEY, ecid);
  }

  /**
   * Deletes the ECID from the DataStore
   * @returns void
   */
  private deleteECID() {
    Log.verbose(LOG_SOURCE, LOG_TAG, `deleteECID() -  Deleting ECID.`);
    this.dataStore.delete(this.ECID_KEY);
  }

  /**
   * Loads the ECID from the DataStore
   * @returns Promise<string | null>
   */
  private async getECIDFromPersistence(): Promise<string | null> {
    Log.verbose(LOG_SOURCE, LOG_TAG, `getECIDFromPersistence() -  Loading ECID from persistence.`);
    const ecid = await this.dataStore.get(this.ECID_KEY);

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getECIDFromPersistence() -  ECID loaded from persistence ECID:(${ecid}).`
    );
    return Promise.resolve(ecid);
  }
}
