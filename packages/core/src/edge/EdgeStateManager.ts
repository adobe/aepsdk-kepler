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

import { IdentityManager } from "./identity/IdentityManager";
import { ConsentManager, ConsentValue } from "./consent/ConsentManager";
import { EdgeConstants } from "./EdgeConstants";
import { DataObject, EventData } from "../core/eventhub/EventData";
import { Log } from "../core/utils/Log";
import { Event } from "../core/eventhub";
import { isNullOrEmptyString } from "../core/utils/StringUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeStateManager";

const CONFIGURATION = EdgeConstants.ConfigurationKey;
const SHARED_STATE_KEYS = EdgeConstants.SharedState.Keys;

export class EdgeStateManager {
  private datastreamId: string | null = null;
  private edgeDomain: string | null = null;
  private defaultConsent: DataObject | null = null;
  private lastSharedState: DataObject = {};

  constructor(
    private createSharedState: (data: DataObject, event: Event | null) => void,
    private identityManager: IdentityManager,
    private consentManager: ConsentManager
  ) {}

  /**
   * Boots up the EdgeStateManager and load the persisted values from the DataStore.
   * This will bootUp the IdentityManager and ConsentManager.
   * @returns Promise<void>
   */
  async bootUp(): Promise<void> {
    return Promise.all([this.identityManager.bootUp(), this.consentManager.bootUp()])
      .then(() => {
        // Share the initial shared state
        this.updateSharedStateIfChanged();

        Log.error(LOG_SOURCE, LOG_TAG, "EdgeStateManager bootUp complete");
        Promise.resolve();
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `EdgeStateManager bootUp failed ${error}`);
        Promise.reject(error);
      });
  }

  /**
   * Handle the configuration update and update the state accordingly.
   * @param data The configuration data.
   */
  public handleConfigurationUpdate(data: EventData | null): void {
    if (!data) {
      Log.debug(LOG_SOURCE, LOG_TAG, "handleConfigurationUpdate() - No data provided.");
      return;
    }

    this.datastreamId = data.getString(CONFIGURATION.DATASTREAM_ID) ?? null;
    this.edgeDomain = data.getString(CONFIGURATION.EDGE_DOMAIN) ?? null;
    this.defaultConsent = data.getDataObject(CONFIGURATION.DEFAULT_CONSENT) ?? null;

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `handleConfigurationUpdate() - Datastream ID: ${this.datastreamId}, Edge Domain: ${
        this.edgeDomain
      }, Default Consent: ${JSON.stringify(this.defaultConsent)}`
    );
  }

  /**
   * Returns the edge domain.
   * @returns string | null
   */
  getEdgeDomain(): string | null {
    return this.edgeDomain;
  }

  /**
   * Returns the datastream ID.
   * @returns string | null
   */
  getDatastreamId(): string | null {
    return this.datastreamId;
  }

  /**
   * Returns the default consent.
   * @returns DataObject | null
   */
  getDefaultConsent(): DataObject | null {
    return this.defaultConsent;
  }

  /**
   * Returns the ECID.
   * @returns string | null
   */
  getEcid(): string | null {
    return this.identityManager.getECID();
  }

  /**
   * Returns the Identity Map.
   * @returns DataObject | null
   */
  getIdentityMap(): DataObject | null {
    return this.identityManager.getIdentityMap();
  }

  /**
   * Returns the Collect Consent.
   * @returns ConsentValue | null
   */
  getCollectConsent(): ConsentValue | null {
    return this.consentManager.getCollectConsent();
  }

  /**
   * Updates the shared state if the state has changed.
   */
  updateSharedStateIfChanged(): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      "updateSharedStateIfChanged() - Updating shared state if state has changed."
    );
    const ecid = this.identityManager.getECID();
    const collectConsent = this.consentManager.getCollectConsent();

    const sharedState: DataObject = {};
    if (!isNullOrEmptyString(ecid)) {
      sharedState[SHARED_STATE_KEYS.ECID] = ecid;
    }

    if (!isNullOrEmptyString(collectConsent)) {
      sharedState[SHARED_STATE_KEYS.CONSENT_COLLECT] = collectConsent;
    }

    if (this.hasStateUpdated(this.lastSharedState, sharedState)) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `updateSharedStateIfChanged() - Shared state has changed. New shared state: (${JSON.stringify(
          sharedState
        )})`
      );
      this.createSharedState(sharedState, null);
      this.lastSharedState = sharedState;
    }
  }

  /**
   * Checks if the state has changed.
   * @param previousState The previous state.
   * @param newState The new state.
   * @returns boolean
   */
  private hasStateUpdated(previousState: DataObject | null, newState: DataObject): boolean {
    return JSON.stringify(previousState) !== JSON.stringify(newState);
  }
}
