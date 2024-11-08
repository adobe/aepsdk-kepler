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
import { DataObject, EventData, DataArray } from "../../core/eventhub/EventData";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
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
  private defaultConsent: DataObject | null = null;

  constructor(dataStore: DataStore) {
    this.dataStore = dataStore;
  }

  /**
   * Processes the Configuration Event to update the defaultConsent value.
   * @param event Event
   */
  processConfigurationEvent(event: Event) {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processConfigurationEvent() -  Processing Configuration Event.`
    );
    const data: EventData | null = event.data;
    this.defaultConsent =
      data?.getDataObject(EdgeConstants.ConfigurationKey.DEFAULT_CONSENT) ?? null;
  }

  /**
   * Processes the Edge response to update the Collect consent value.
   * @param responseHandle DataObject
   **/
  processEdgeResponse(responseHandle: DataObject) {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processEdgeResponse() -  Processing Edge Response handle:(${JSON.stringify(
        responseHandle
      )}).`
    );

    const payloadArr = (responseHandle["payload"] as DataArray) ?? [];

    for (const payload of payloadArr) {
      const payloadObj = (payload as DataObject) ?? {};
      const collect = (payloadObj["collect"] as DataObject) ?? {};
      const val = (collect["val"] as ConsentValue) ?? null;

      if (Object.values(ConsentValue).includes(val)) {
        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `processEdgeResponse() -  Updating Collect Consent with value: (${val}).`
        );
        this.updateCollectConsent(val);
      } else {
        Log.debug(
          LOG_SOURCE,
          LOG_TAG,
          `processEdgeResponse() -  Invalid Collect Consent value: (${collect["val"]}).`
        );
      }
    }
  }

  /**
   * Returns the Collect consent value from cache, persistence or configuration
   * in the respective order of priority. Returns null if the consent is not
   * available in any of the sources.
   * @returns Promise<ConsentValue | null>
   */
  async getCollectConsent(): Promise<ConsentValue | null> {
    Log.debug(LOG_SOURCE, LOG_TAG, `getCollectConsent() -  Getting collect consent value.`);

    if (this.collectConsent) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `getCollectConsent() -  Returning collect consent value from cache: (${this.collectConsent})`
      );

      return Promise.resolve(this.collectConsent);
    }

    return this._getCollectConsentFromPersistence().then((consent) => {
      // If the consent is available in the persistence, return it
      const consentValue = consent as ConsentValue | null;
      if (consent) {
        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `getCollectConsent() -  Returning collect consent value from persistence: (${consentValue})`
        );
        return Promise.resolve(consentValue);
      } else {
        // If the consent is not available in the persistence, get it from the configuration
        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `getCollectConsent() -  Returning collect consent value from configuration.`
        );
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
      LOG_SOURCE,
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
      LOG_SOURCE,
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
      LOG_SOURCE,
      LOG_TAG,
      `deleteCollectConsentFromPersistence() -  Deleting Collect Consent from persistence.`
    );
    this.dataStore.delete(EdgeConstants.DataStoreKey.COLLECT_CONSENT);
  }

  /**
   * Returns the Collect consent value from the persistence.
   * @returns Promise<ConsentValue | null>
   */
  private _getCollectConsentFromPersistence(): Promise<ConsentValue | null> {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getCollectConsentFromPersistence() -  Getting Collect Consent from persistence.`
    );

    return new Promise((resolve) => {
      this.dataStore.get(EdgeConstants.DataStoreKey.COLLECT_CONSENT).then((value) => {
        resolve(value as ConsentValue | null);
      });
    });
  }

  /**
   * Returns the Collect consent value from the defaultConsent set in configuration.
   * @returns ConsentValue | null
   *
   */
  private _getCollectConsentFromConfiguration(): ConsentValue | null {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getCollectConsentFromConfiguration() -  Getting Collect Consent from configuration.`
    );

    if (!this.defaultConsent) {
      return null;
    }

    const consents: DataObject =
      (this.defaultConsent[DefaultConsentConstants.CONSENTS] as DataObject) ?? null;

    const collectConsent: DataObject | null =
      (consents[DefaultConsentConstants.COLLECT] as DataObject) ?? null;

    const collectConsentValue: ConsentValue | null =
      (collectConsent[DefaultConsentConstants.VAL] as ConsentValue) ?? null;

    const ret = Object.values(ConsentValue).includes(collectConsentValue)
      ? collectConsentValue
      : null;

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `getCollectConsentFromConfiguration() -  Returning Collect Consent from configuration: (${ret})`
    );
    return ret;
  }
}
