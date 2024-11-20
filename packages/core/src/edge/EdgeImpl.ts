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
import { ExtensionContainer, Extension } from "../core/extension";
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
import { EdgeStateManager } from "./EdgeStateManager";
import { DataObject, DataType, EventData } from "../core/eventhub/EventData";
import { uuid } from "../core/utils/uuid";
import { isNullOrEmptyString } from "../core/utils/StringUtil";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: DataObject, event: Event | null) => void;

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeImpl";

// Implementation
export class EdgeImpl implements Edge, Extension {
  readonly EXTENSION: Extension = this;

  private isActive: boolean = false;
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private dataStore: DataStore | null = null;
  private consentManager: ConsentManager | null = null;
  private identityManager: IdentityManager | null = null;
  private locationHintManager: LocationHintManager | null = null;
  private stateStoreManager: StateStoreManager | null = null;
  private edgeResponseManager: EdgeResponseManager | null = null;
  private edgeStateManager: EdgeStateManager | null = null;
  private dispatchFn: DispatchFn | null = null;
  private createSharedState: createXDMSharedState | null = null;
  private hitProcessor: EdgeHitProcessor | null = null;
  private pendingIdentityResponses: {
    resolve: (value: string | null) => void;
    reject: (reason?: string | null) => void;
  }[] = [];
  private hitProcessingTimer: NodeJS.Timeout | null = null;

  public version: string = EdgeConstants.EXTENSION_VERSION;
  public name: string = EdgeConstants.EXTENSION_NAME;

  /**
   * Boots the Edge extension.
   * @param extensionContainer ExtensionContainer
   * @param serviceLookup ServiceLookup
   */
  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): Promise<void> {
    this.container = extensionContainer;
    this.dispatchFn = this.dispatchEvent.bind(this);
    this.createSharedState = this.createXDMSharedState.bind(this);

    this.serviceLookup = serviceLookup;
    this.dataStore = serviceLookup.getService("dataStore");

    this.consentManager = new ConsentManager(this.dataStore, this.dispatchFn);
    this.identityManager = new IdentityManager(this.dataStore, this.dispatchFn);
    this.locationHintManager = new LocationHintManager(this.dataStore);
    this.stateStoreManager = new StateStoreManager(this.dataStore);

    this.edgeStateManager = new EdgeStateManager(
      this.dispatchFn,
      this.createSharedState,
      this.dataStore,
      this.identityManager,
      this.consentManager
    );

    this.edgeResponseManager = new EdgeResponseManager(
      this.dispatchFn,
      this.edgeStateManager,
      this.identityManager,
      this.consentManager,
      this.locationHintManager,
      this.stateStoreManager
    );

    this.hitProcessor = new EdgeHitProcessor(this.edgeResponseManager, this.edgeStateManager);
    this.isActive = true;

    this.registerListeners();
    this.startHitProcessingTimer();

    return Promise.all([this.edgeStateManager.bootup(), this.edgeResponseManager.bootup()])
      .then(() => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Edge extension bootup complete");
        Promise.resolve();
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `Edge extension bootup failed with error:(${error})`);
        Promise.reject(error);
      });
  }

  /**
   * Creates the shared state with the provided data for the Edge extension.
   * @param data Data
   */
  createXDMSharedState(data: DataObject, event: Event | null = null): void {
    Log.debug(LOG_SOURCE, LOG_TAG, "createSharedState() - Creating shared state with data: ()");

    Log.verbose(LOG_SOURCE, LOG_TAG, `createSharedState() - Data: (${data.toString()})`);
    const state = EventData.buildFrom(data) as EventData;

    Log.verbose(LOG_SOURCE, LOG_TAG, `createSharedState() - State: (${state.toString()})`);
    this.container?.createXDMSharedState(state, event);
  }

  /**
   * Dispatches the event to the eventhub.
   * @param event Event
   */
  dispatchEvent(event: Event): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `dispatchEvent() - Dispatching event: (${JSON.stringify(event)}).`
    );
    if (this.isActive) {
      // handle outgoing event to resolve any pending promises
      this.handleOutgoingEvent(event);
      // dispatch the event to the event hub
      this.container?.dispatch(event);
    }
  }

  /**
   * Returns the Experience Cloud ID (ECID) if available.
   * If the ECID is not available, then it sends an edge request to fetch the ECID.
   * @returns Promise<string | null>
   */
  async getExperienceCloudId(): Promise<string | null> {
    Log.debug(LOG_SOURCE, LOG_TAG, "getExperienceCloudId() - Getting ECID.");
    const ecid = this.edgeStateManager?.getEcid() ?? null;

    if (!isNullOrEmptyString(ecid)) {
      Log.verbose(LOG_SOURCE, LOG_TAG, `getExperienceCloudId() - Returning ECID: (${ecid}).`);
      return Promise.resolve(ecid);
    } else {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "getECID() - ECID is not set. Requesting ECID from Edge server."
      );

      this.sendEventForIdentity();

      return new Promise((resolve, reject) => {
        this.pendingIdentityResponses.push({ resolve, reject });
      });
    }
  }

  /**
   * Sends the event data to the edge server
   * @param data Object containing the event data
   */
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

  /**
   * Sends the consent data to the edge server
   * @param consent Object containing the consent data
   */
  setConsent(consent: DataObject) {
    Log.debug(LOG_SOURCE, LOG_TAG, "setConsent() - Received consent data: " + consent.toString());

    const consentHit = EdgeHit.builder().setData(consent).setType(EdgeHitType.CONSENT).build();

    this.hitProcessor?.queueHit(consentHit);
    this.hitProcessor?.process();
  }

  /**
   * Unregisters the Edge extension.
   */
  onUnregister(): void {
    this.isActive = false;
    this.container = null;
    this.serviceLookup = null;
    this.dataStore = null;
    this.consentManager = null;
    this.identityManager = null;
    this.locationHintManager = null;
    this.stateStoreManager = null;
    this.edgeStateManager = null;
    this.edgeResponseManager = null;
    this.dispatchFn = null;
    this.createSharedState = null;
    this.hitProcessor = null;
    this.pendingIdentityResponses = [];
    this.cancelHitProcessingTimer();
  }

  /**
   * Sends an edge request to fetch the ECID.
   * This event is sent only once when the getECID() is called
   * and the ECID is not available.
   */
  private sendEventForIdentity() {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      "sendEventForIdentity() - Sending edge request to fetch Identity."
    );
    const identityHit = EdgeHit.builder()
      .setType(EdgeHitType.EDGE)
      .setTimestamp(Date.now())
      .setRequestId(uuid())
      .build();

    this.hitProcessor?.queueHit(identityHit);
    this.hitProcessor?.process();
  }

  /**
   * Registers the listeners for the Edge extension.
   */
  private registerListeners() {
    Log.debug(EdgeConstants.EXTENSION_NAME, LOG_TAG, "registerListeners() - Registering listeners");

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

    this.container.registerEventListener(EventType.HUB, EventSource.SHARED_STATE, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
      if (this.isActive) {
        const eventData = event.data;
        const stateOwner = eventData?.getString(EdgeConstants.SharedState.STATE_OWNER);

        if (stateOwner === EdgeConstants.SharedState.Owner.CONFIGURATION) {
          Log.verbose(LOG_SOURCE, LOG_TAG, "Received configuration shared state event.");
          const state = this.container?.getXDMSharedState(stateOwner, event);
          if (state) {
            this.edgeStateManager?.handleConfigurationUpdate(state.value);
          }
        }
      }
    });
  }

  /**
   * Handles the outgoing events.
   * @param event Event
   */
  private handleOutgoingEvent(event: Event) {
    Log.verbose(LOG_SOURCE, LOG_TAG, "handleOutgoingEvent() - Handling outgoing event.");
    if (!this.isActive) {
      return;
    }

    if (event.type === EventType.EDGE_IDENTITY && event.source === EventSource.RESPONSE_IDENTITY) {
      this.resolveWaitingIdentityPromises(event);
    }
  }

  /**
   * Resolves the waiting promises with the ECID.
   * @param event Response Event containing the ECID
   * @returns
   */
  private resolveWaitingIdentityPromises(event: Event): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      "resolveWaitingIdentityPromises() - Resolving waiting promises."
    );
    for (const waitingPromise of this.pendingIdentityResponses) {
      if (!waitingPromise) {
        return;
      }

      const ecid = event.data?.getString(EdgeConstants.EventData.Keys.ECID) ?? null;
      if (!isNullOrEmptyString(ecid)) {
        waitingPromise.resolve(ecid);
      } else {
        waitingPromise.reject(null);
      }
    }
  }

  /**
   * Starts the hit processing timer.
   * This timer will process the hits every 500ms.
   * This method is called when the Edge extension is registered.
   */
  private startHitProcessingTimer() {
    Log.debug(LOG_SOURCE, LOG_TAG, "startHitProcessingTimer() - Starting hit processing timer.");
    this.hitProcessingTimer = setInterval(() => {
      this.hitProcessor?.process();
    }, 500);
  }

  /**
   * Cancels the hit processing timer.
   * The timer is cleared when the Edge extension is unregistered.
   */
  private cancelHitProcessingTimer() {
    Log.debug(LOG_SOURCE, LOG_TAG, "cancelHitProcessingTimer() - Cancelling hit processing timer.");
    if (this.hitProcessingTimer) {
      clearInterval(this.hitProcessingTimer);
    }
  }
}
