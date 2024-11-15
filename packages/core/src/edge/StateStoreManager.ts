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
import { DataStore } from "../core/services";
import { isNullOrEmptyString } from "../core/utils/StringUtil";
import { Log } from "../core/utils/Log";
import { EdgeConstants } from "./EdgeConstants";
import { DataArray, DataObject } from "../core/eventhub/EventData";
import {
  getAsDataArray,
  getAsDataObject,
  isNullOrEmptyObject,
  getAsString,
  getAsNumber,
  isPositiveWholeNumber,
} from "../core/utils/DataTypeUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "StateStoreManager";
const KEY = "key";
const MAX_AGE = "maxAge";
const PAYLOAD_KEY = "payload";
const EXPIRY_TS_KEY = "expiryTS";

export class StateStoreManager {
  private expiryTS: number | null = null;
  private stateStoreObj: DataObject;

  constructor(private dataStore: DataStore) {
    this.stateStoreObj = {};
  }

  /**
   * Bootup the StateStoreManager and load the
   * state store object from persistence.
   * @returns Promise<void>
   */
  async bootup(): Promise<void> {
    Log.debug(LOG_SOURCE, LOG_TAG, `bootup() - Booting up StateStoreManager.`);
    this.stateStoreObj = (await this.getStateStoreFromPersistence()) ?? {};
    return Promise.resolve();
  }

  /**
   * Processes the edge response and updates the state store.
   * @param responseHandle The response handle containing the state store payload.
   */
  public processEdgeResponse(responseHandle: DataObject): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `StateStoreManager: processEdgeResponse called with responseHandle:  ${JSON.stringify(
        responseHandle
      )}`
    );
    const payloadArray = getAsDataArray(responseHandle[PAYLOAD_KEY]) ?? [];

    for (const payload of payloadArray) {
      const payloadObj = getAsDataObject(payload) ?? {};
      this.addToStateStore(payloadObj);
    }
    this.persistStateStore();
  }

  /**
   * Returns the state store object with active state entries.
   * @param startTimeMillis The start time in milliseconds.
   * @returns The state store object.
   */
  public getStateStore(startTimeMillis: number = Date.now()): DataArray | null {
    const activeStateStoreEntries: DataArray = [];

    for (const [key, value] of Object.entries(this.stateStoreObj)) {
      const entry = getAsDataObject(value) ?? {};
      const expiryTS = getAsNumber(entry[EXPIRY_TS_KEY]) ?? 0;

      if (this.isExpired(expiryTS, startTimeMillis)) {
        Log.debug(
          LOG_SOURCE,
          LOG_TAG,
          `getStateStore() - Entry with key:(${key}) is expired at TS:(${expiryTS}). Deleting the entry.`
        );

        delete this.stateStoreObj[key];
        continue;
      }

      activeStateStoreEntries.push(entry[PAYLOAD_KEY]);
    }

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getStateStoreObj() - Returning active stateStores: (${JSON.stringify(
        activeStateStoreEntries
      )})`
    );

    return activeStateStoreEntries;
  }

  /**
   * Adds the payload to the state store.
   * @param payload The payload to be added to the state store.
   * @param startTimeMillis The start time in milliseconds.
   */
  private addToStateStore(payload: DataObject, startTimeMillis: number = Date.now()) {
    if (isNullOrEmptyObject(payload)) {
      return;
    }

    const key = getAsString(payload[KEY]) ?? "";
    if (isNullOrEmptyString(key)) {
      return;
    }

    const maxAgeSeconds = getAsNumber(payload[MAX_AGE]) ?? 0;
    if (!isPositiveWholeNumber(maxAgeSeconds)) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        `addToStateStore() payload.maxAge value:(${maxAgeSeconds}). Deleting the state store entry.`
      );

      delete this.stateStoreObj?.[key];
      return;
    }

    const expiryTS = startTimeMillis + maxAgeSeconds * 1000;
    this.stateStoreObj[key] = {
      [PAYLOAD_KEY]: payload,
      [EXPIRY_TS_KEY]: expiryTS,
    };
  }

  /**
   * Persists the state store object to the data store.
   * @returns A promise that resolves when the state store object is persisted.
   */
  private async persistStateStore(): Promise<void> {
    if (isNullOrEmptyObject(this.stateStoreObj)) {
      Log.error(LOG_SOURCE, LOG_TAG, "persistStateStore() - StateStore object is null or empty.");
      return;
    }

    try {
      const stateStoreJson = JSON.stringify(this.stateStoreObj);

      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `persistStateStore() - Persisting StateStore object: ${stateStoreJson}`
      );
      return this.dataStore.set("stateStore", stateStoreJson);
    } catch (exception) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `persistStateStore() - Failed to persist stateStoreJson, error: ${
          (exception as Error).message
        }`
      );
    }
  }

  /**
   * Gets the state store object from the data store.
   * @returns A promise that resolves with the state store object.
   */
  private async getStateStoreFromPersistence(): Promise<DataObject | null> {
    const stateStoreJson = getAsString(await this.dataStore.get("stateStore")) ?? "";

    if (isNullOrEmptyString(stateStoreJson)) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "getStateStoreFromPersistence() - StateStore object is null or empty."
      );
      return Promise.resolve(null);
    }

    try {
      const stateStoreObj = JSON.parse(stateStoreJson);
      return Promise.resolve(stateStoreObj);
    } catch (error) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `getStateStoreFromPersistence() - Failed to parse stateStoreJson, error: ${
          (error as Error).message
        }`
      );
    }
    return Promise.resolve(null);
  }

  /**
   * Checks if the state store entry is expired.
   * @param expiryTS The expiry timestamp.
   * @param startTimeMillis The start time in milliseconds.
   * @returns True if the state store entry is expired, false otherwise.
   */
  private isExpired(expiryTS: number, startTimeMillis: number): boolean {
    return expiryTS < startTimeMillis;
  }
}
