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

import { Edge } from ".";
import { Event, EventType, EventSource } from "../core/eventhub";
import { ExtensionContainer } from "../core/extension";
import { DataStore, ServiceLookup } from "../core/services";
import { ConsentManager } from "./consent/ConsentManager";
import { EdgeConstants } from "./EdgeConstants";
import { IdentityManager } from "./identity/IdentityManager";
import { Log } from "../core/utils/Log";
import { EdgeHit, EdgeHitType } from "./EdgeHit";
import { EdgeHitProcessor } from "./EdgeHitProcessor";
import { EdgeResponseManager } from "./EdgeResponseManager";
import { LocationHintManager } from "./LocationHintManager";
import { StateStoreManager } from "./StateStoreManager";
import { DataObject, DataType } from "../core/eventhub/EventData";
import { uuid } from "../core/utils/uuid";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: Record<string, DataType>, event: Event | null) => void;

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeImpl";

// Implementation
export class EdgeImpl implements Edge {
  private isActive: boolean = false;
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private dataStore: DataStore | null = null;
  private consentManager: ConsentManager | null = null;
  private identityManager: IdentityManager | null = null;
  private locationHintManager: LocationHintManager | null = null;
  private stateStoreManager: StateStoreManager | null = null;
  private edgeResponseManager: EdgeResponseManager | null = null;
  private dispatchFn: DispatchFn | null = null;
  private createXDMSharedState: createXDMSharedState | null = null;
  private hitProcessor: EdgeHitProcessor | null = null;

  public version: string = EdgeConstants.EXTENSION_VERSION;
  public name: string = EdgeConstants.EXTENSION_NAME;

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): Promise<void> {
    this.container = extensionContainer;
    this.dispatchFn = this.container.dispatch;
    //this.createXDMSharedState = this.container.createXDMSharedState;

    this.serviceLookup = serviceLookup;
    this.dataStore = serviceLookup.getService("dataStore");

    this.consentManager = new ConsentManager(this.dataStore);
    this.identityManager = new IdentityManager(this.dataStore);
    this.locationHintManager = new LocationHintManager(this.dataStore);
    this.stateStoreManager = new StateStoreManager(this.dataStore);

    this.edgeResponseManager = new EdgeResponseManager(
      this.identityManager,
      this.consentManager,
      this.locationHintManager,
      this.stateStoreManager
    );
    this.hitProcessor = new EdgeHitProcessor(
      this.edgeResponseManager,
      this.consentManager,
      this.identityManager,
      this.locationHintManager,
      this.stateStoreManager
    );
    this.isActive = true;

    this._registerListeners();
    // TODO: add get ECID from the local storage logic here.
    return Promise.resolve();
  }

  getExperienceCloudId(): Promise<string | null> {
    Log.debug(LOG_SOURCE, LOG_TAG, "getExperienceCloudId() - Getting ECID.");
    return this.identityManager?.getECID() ?? Promise.resolve(null);
  }

  sendEvent(data: DataObject): void {
    const xdm = data.xdm as DataObject;
    if (!xdm) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `sendEvent() - Event data(${data}) does not contain xdm object.`
      );
      return;
    }

    Log.debug(LOG_SOURCE, LOG_TAG, "sendEvent() - Received event with data: " + data.toString());

    let hitTimestamp = xdm["timestamp"] as number;
    if (!hitTimestamp) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "sendEvent() - Adding timestamp to the event data, since timestamp not present."
      );
      hitTimestamp = Date.now();
      xdm["timestamp"] = hitTimestamp;
    }

    const edgeHit = EdgeHit.builder()
      .setRequestId(uuid())
      .setData(data)
      .setTimestamp(hitTimestamp)
      .build();

    this.hitProcessor?.queueHit(edgeHit);
    this.hitProcessor?.process();
  }

  setConsent(consent: DataObject) {
    Log.debug(LOG_SOURCE, LOG_TAG, "setConsent() - Received consent data: " + consent.toString());

    const consentHit = EdgeHit.builder().setData(consent).setType(EdgeHitType.CONSENT).build();

    this.hitProcessor?.queueHit(consentHit);
    this.hitProcessor?.process();
  }

  // setConsent(consent: Map<string, object>): void {
  //   //TODO: implement the logic here
  // }

  getECID(): Promise<string | null> {
    return this.identityManager?.getECID() ?? Promise.resolve(null);
  }

  _registerListeners(): void {
    Log.debug(
      EdgeConstants.EXTENSION_NAME,
      LOG_TAG,
      "_registerListeners() - Registering listeners"
    );

    // if the container is not available, then return
    if (this.container === null) {
      // log error message
      return;
    }

    this.container.registerEventListener(EventType.EDGE, EventSource.REQUEST_CONTENT, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
      if (this.isActive) {
        //TODO: implement the logic here
        const eventData = event.data;
        // const xdm = eventData?.getDataObject("xdm");
        // const data = eventData?.getDataObject("data");
        if (eventData) {
          Log.debug(LOG_SOURCE, LOG_TAG, "Received data: " + eventData?.toString());
          this.sendEvent(eventData.getData());
        }
      }
    });
  }

  onUnregister(): void {
    this.isActive = false;
    this.container = null;
    this.serviceLookup = null;
  }

  async _createXDMSharedState(): Promise<void> {
    const state: Record<string, DataType> = {};
    // identity Map
    const identityMap = await this.identityManager?.getIdentityMap();
    if (identityMap) {
      state[EdgeConstants.Request.Data.IDENTITY_MAP] = identityMap;
    }

    // TODO: Add consents data to the state

    //this.createXDMSharedState?.(state, null);
  }

  // Add repeated timer to process the hits
  // This method will be called every 5 seconds
}
