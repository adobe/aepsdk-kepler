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
import { DataObject } from "../core/eventhub/EventData";
import { getArray, getDataObject, getNumber, getString } from "../core/utils/DataObjectUtil";

const LOCATION_HINT_KEY = "locationHint";
const LOCATION_HINT_VALUE = "value";
const LOCATION_HINT_EXPIRY_TS = "expiryTS";
const DEFAULT_TTL_SECONDS = 1800; // 30 minutes
const LOCATION_HINT_SCOPE = "EdgeNetwork";

const LOG_TAG = "LocationHintManager";
const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;

const RESPONSE_DATA_KEYS = EdgeConstants.ResponseData.Keys;

/**
 * Manages the location hint for the Edge Network.
 */
export class LocationHintManager {
  private dataStore: DataStore;
  private locationHint: string | null = null;
  private expiryTS: number | null = null;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Boots up the LocationHintManager. Load the location hint from persistence.
   * @returns Promise<void>
   */
  public async bootUp(): Promise<void> {
    Log.debug(LOG_SOURCE, LOG_TAG, `bootUp() - Booting up LocationHintManager.`);
    const locationHintObj = await this.getLocationHintFromPersistence();

    this.locationHint = (locationHintObj?.[LOCATION_HINT_VALUE] as string) || null;
    this.expiryTS = (locationHintObj?.[LOCATION_HINT_EXPIRY_TS] as number) || null;

    return Promise.resolve();
  }

  public processEdgeResponse(responseHandle: DataObject): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processEdgeResponse() -  Processing Edge Response handle:(${JSON.stringify(
        responseHandle
      )}).`
    );

    const payloadArray = getArray(responseHandle, RESPONSE_DATA_KEYS.PAYLOAD) ?? [];

    for (const payload of payloadArray) {
      const payloadObj = getDataObject((payload as DataObject) ?? {}) ?? {};
      const scope = getString(payloadObj, RESPONSE_DATA_KEYS.SCOPE) ?? "";

      if (scope.toLowerCase() === LOCATION_HINT_SCOPE.toLowerCase()) {
        const locationHint = getString(payloadObj, RESPONSE_DATA_KEYS.HINT) ?? "";
        const ttlSeconds =
          getNumber(payloadObj, RESPONSE_DATA_KEYS.TTL_SECONDS) ?? DEFAULT_TTL_SECONDS;

        if (isNullOrEmptyString(locationHint)) {
          Log.debug(
            LOG_SOURCE,
            LOG_TAG,
            "processEdgeResponse() - Location hint value is null or empty."
          );

          return;
        }

        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `processEdgeResponse() - Setting location hint: ${locationHint} with ttlSeconds: ${ttlSeconds}`
        );

        this.setLocationHint(locationHint, ttlSeconds);
      }
    }
  }

  /**
   * Gets the location hint.
   * @returns The location hint or null if it is not available or expired.
   */
  public getLocationHint(): string | null {
    Log.verbose(LOG_SOURCE, LOG_TAG, "getLocationHint() - Getting location hint.");

    if (isNullOrEmptyString(this.locationHint) || this.isExpired()) {
      Log.debug(
        LOG_SOURCE,
        LOG_TAG,
        "getLocationHint() - Returning null, location hint is either empty or expired."
      );

      this.dataStore.delete(LOCATION_HINT_KEY);

      return null;
    }

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getLocationHint() - Returning location hint value (${this.locationHint})`
    );
    return this.locationHint;
  }

  /**
   * Sets the location hint.
   * @param locationHint The location hint.
   * @param ttlSeconds The time-to-live in seconds for the location hint.
   * @param startTimeMillis The start time in milliseconds for the location hint.
   * @returns A promise that resolves when the location hint is set.
   */
  public async setLocationHint(
    locationHint: string,
    ttlSeconds: number | null,
    startTimeMillis: number = Date.now()
  ): Promise<void> {
    const expiryTS =
      startTimeMillis + (ttlSeconds !== null ? ttlSeconds : DEFAULT_TTL_SECONDS) * 1000;

    this.locationHint = locationHint;
    this.expiryTS = expiryTS;

    const locationHintObj: DataObject = {
      [LOCATION_HINT_VALUE]: locationHint,
      [LOCATION_HINT_EXPIRY_TS]: expiryTS,
    };

    const locationHintJson = JSON.stringify(locationHintObj);

    if (isNullOrEmptyString(locationHintJson)) {
      Log.error(LOG_SOURCE, LOG_TAG, "setLocationHint() - Location hint object is null or empty.");
      return;
    }

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `setLocationHint() - Persisting location hint object: ${locationHintJson}`
    );

    return this.dataStore.set(LOCATION_HINT_KEY, locationHintJson!);
  }

  /**
   * Checks if the location hint is expired.
   * @param currentTime The current time in milliseconds.
   * @returns True if the location hint is expired, false otherwise.
   */
  private isExpired(currentTime: number = Date.now()): boolean {
    const isExpired = this.expiryTS !== null && this.expiryTS < currentTime;

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `isExpired() - Location hint (${this.locationHint}) has ${
        isExpired ? "expired" : "not expired"
      } at expiryTS: ${this.expiryTS} and currentTime: ${currentTime}`
    );

    return isExpired;
  }

  /**
   * Gets the location hint from persistence.
   * @returns The location hint object from persistence.
   * @returns null if the location hint is not found.
   */
  private async getLocationHintFromPersistence(): Promise<DataObject | null> {
    const locationHintJson = await this.dataStore.get(LOCATION_HINT_KEY);

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getLocationHintFromPersistence() - Returning location hint json from persistence: ${locationHintJson}}`
    );

    try {
      const locationHintObj = JSON.parse(locationHintJson || "{}");
      return locationHintObj;
    } catch (exception) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `getLocationHintFromPersistence() - Error parsing location hint json: ${locationHintJson}, error: ${exception}`
      );
    }

    return null;
  }
}
