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
import { DataObject, EventData } from "../../core/eventhub/EventData";
import { getArray, getString } from "../../core/utils/DataObjectUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "ConsentManager";
const DefaultConsentConstants = {
  CONSENTS: "consents",
  COLLECT: "collect",
  VAL: "val",
};

const RESPONSE_DATA_KEYS = EdgeConstants.ResponseData.Keys;

export enum ConsentValue {
  YES = "y",
  NO = "n",
  PENDING = "p",
}

export class ConsentManager {
  private collectConsent: ConsentValue | null = null;
  private defaultConsent: DataObject | null = null;

  constructor(private dataStore: DataStore, private dispatchFn: (event: Event) => void) {}

  /**
   * Bootup the ConsentManager and
   * load the Collect consent value from persistence.
   * @returns Promise<void>
   */
  async bootUp(): Promise<void> {
    Log.debug(LOG_SOURCE, LOG_TAG, `bootUp() -  Booting up ConsentManager.`);
    this.collectConsent = await this.getCollectConsentFromPersistence();
    Promise.resolve();
  }

  /**
   * Processes the Configuration Event to update the defaultConsent value.
   * @param data EventData containing the configuration key-value pairs.
   */
  processConfigurationEvent(data: EventData | null) {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processConfigurationEvent() -  Processing Configuration Event.`
    );

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

    const payloadArray = getArray(responseHandle, RESPONSE_DATA_KEYS.PAYLOAD) ?? [];

    for (const payload of payloadArray) {
      const collectVal =
        (getString(
          (payload as DataObject) ?? {},
          RESPONSE_DATA_KEYS.COLLECT,
          RESPONSE_DATA_KEYS.VAL
        ) as ConsentValue) ?? null;

      if (Object.values(ConsentValue).includes(collectVal)) {
        Log.verbose(
          LOG_SOURCE,
          LOG_TAG,
          `processEdgeResponse() -  Updating Collect Consent with value: (${collectVal}).`
        );
        this.updateCollectConsent(collectVal);
      } else {
        Log.debug(
          LOG_SOURCE,
          LOG_TAG,
          `processEdgeResponse() -  Invalid Collect Consent value: (${collectVal}).`
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
  public getCollectConsent(): ConsentValue | null {
    Log.debug(LOG_SOURCE, LOG_TAG, `getCollectConsent() -  Getting collect consent value.`);

    const consent = this.collectConsent
      ? this.collectConsent
      : this.getCollectConsentFromConfiguration();

    return consent;
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
      this.saveCollectConsentToPersistence(consent);
    } else {
      this.deleteCollectConsentFromPersistence();
    }
  }

  /**
   * Saves the Collect consent value to the persistence.
   * @param consent ConsentValue
   */
  private saveCollectConsentToPersistence(consent: ConsentValue) {
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
  private deleteCollectConsentFromPersistence() {
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
  private getCollectConsentFromPersistence(): Promise<ConsentValue | null> {
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
  private getCollectConsentFromConfiguration(): ConsentValue | null {
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
