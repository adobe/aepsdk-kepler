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

import { Event, EventType, EventSource } from "../../core/eventhub";
import { DataStore } from "../../core/services";
import { EdgeConstants } from "../EdgeConstants";
import { Log } from "../../core/utils/Log";
import { mapFromObject, isNullOrEmptyMap, optMap } from "../../core/utils/MapUtil";

const LOG_TAG = "ConsentManager";
const DefaultConsentConstants = {
  CONSENTS: "consents",
  COLLECT: "collect",
  VAL: "val",
};

export enum ConsentValue {
  YES = "y",
  NO = "n",
  PENDING = "p",
}

export class ConsentManager {
  private dataStore: DataStore;
  private collectConsent: ConsentValue | null = null;
  private defaultConsent: Map<string, any> | null = null;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  processConfigurationEvent(event: Event) {
    Log.verbose(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `processConfigurationEvent() -  Processing Configuration Event.`
    );
    const data: Map<String, any> | null = event.data;
    const defaultConsentObj = data?.get(EdgeConstants.ConfigurationKey.DEFAULT_CONSENT);

    this.defaultConsent = mapFromObject(defaultConsentObj);
  }

  handleConsentEvent(event: Event) {
    // TODO: handle the setConset event
    // Create the payload for the consent request
    // This might be included in the edge extension as it that is responsible for sending the request
  }

  processEdgeResponseEvent(event: Event) {
    // TODO: process the response from the edge
    // Extract the consent value from the response
    // update the collectConsent value
  }

  /**
   * Returns the Collect consent value from cache, persistence or configuration
   * in the respective order of priority. Returns null if the consent is not
   * available in any of the sources.
   * @returns Promise<ConsentValue | null>
   */
  async getCollectConsent(): Promise<ConsentValue | null> {
    Log.debug(EdgeConstants.LOG_SOURCE, LOG_TAG, `getCollectConsent() -  Getting Collect Consent.`);
    if (this.collectConsent) {
      return Promise.resolve(this.collectConsent);
    }

    return this._getCollectConsentFromPersistence().then((consent) => {
      // If the consent is available in the persistence, return it
      if (consent) {
        return Promise.resolve(consent);
      } else {
        // If the consent is not available in the persistence, get it from the configuration
        return Promise.resolve(this._getCollectConsentFromConfiguration());
      }
    });
  }

  /**
   * Updates the Collect consent value in the cache and persistence.
   * Deletes the Collect consent value from the persistence if the passed
   * value is null.
   * @param consent ConsentValue
   */
  updateCollectConsent(consent: ConsentValue) {
    Log.debug(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `updateCollectConsent() -  Updating Collect Consent with value: (${consent})`
    );
    this.collectConsent = consent;
    if (consent) {
      this._saveCollectConsentToPersistence(consent);
    } else {
      this._deleteCollectConsentFromPersistence();
    }
  }

  /**
   * Saves the Collect consent value to the persistence.
   * @param consent ConsentValue
   */
  private _saveCollectConsentToPersistence(consent: ConsentValue) {
    Log.verbose(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `saveCollectConsentToPersistence() -  Saving Collect Consent with value: (${consent})`
    );
    this.dataStore.set(EdgeConstants.DataStoreKey.COLLECT_CONSENT, consent);
  }

  /**
   * Deletes the Collect consent value from the persistence.
   */
  private _deleteCollectConsentFromPersistence() {
    Log.verbose(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `deleteCollectConsentFromPersistence() -  Deleting Collect Consent from persistence.`
    );
    this.dataStore.set(EdgeConstants.DataStoreKey.COLLECT_CONSENT, null);
  }

  /**
   * Returns the Collect consent value from the persistence.
   * @returns Promise<ConsentValue | null>
   */
  private _getCollectConsentFromPersistence(): Promise<ConsentValue | null> {
    Log.verbose(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `getCollectConsentFromPersistence() -  Getting Collect Consent from persistence.`
    );
    return this.dataStore.get(EdgeConstants.DataStoreKey.COLLECT_CONSENT);
  }

  /**
   * Returns the Collect consent value from the defaultConsent set in configuration.
   * @returns ConsentValue | null
   *
   */
  private _getCollectConsentFromConfiguration(): ConsentValue | null {
    Log.verbose(
      EdgeConstants.LOG_SOURCE,
      LOG_TAG,
      `getCollectConsentFromConfiguration() -  Getting Collect Consent from configuration.`
    );

    if (isNullOrEmptyMap(this.defaultConsent)) {
      return null;
    }

    this.defaultConsent = this.defaultConsent as Map<string, any>;

    const consents: Map<string, any> | null = optMap(
      this.defaultConsent,
      DefaultConsentConstants.CONSENTS,
      null
    );

    const collectConsent: Map<string, any> | null = consents
      ? optMap(consents, DefaultConsentConstants.COLLECT, null)
      : null;

    const collectConsentValue: ConsentValue | null = collectConsent
      ? collectConsent.get(DefaultConsentConstants.VAL)
      : null;

    return collectConsentValue && Object.values(ConsentValue).includes(collectConsentValue)
      ? collectConsentValue
      : null;
  }
}
