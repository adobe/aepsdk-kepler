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

import { Event, EventType, EventSource } from "../core/eventhub";
import { ExtensionContainer, Extension } from "../core/extension";
import { DataStore, ServiceLookup } from "../core/services";
import { ConsentManager, ConsentValue } from "./consent/ConsentManager";
import { EdgeConstants } from "./EdgeConstants";
import { IdentityManager } from "./identity/IdentityManager";
import { Log } from "../core/utils/Log";
import { EdgeHit, EdgeHitType } from "./EdgeHit";
import { EdgeHitProcessor } from "./EdgeHitProcessor";
import { EdgeResponseManager } from "./EdgeResponseManager";
import { LocationHintManager } from "./LocationHintManager";
import { StateStoreManager } from "./StateStoreManager";
import { EdgeStateManager } from "./EdgeStateManager";
import { DataObject, EventData } from "../core/eventhub/EventData";
import { isNullOrEmptyString } from "../core/utils/StringUtil";
import { safeStringify } from "../core/utils/common";
import { getNumber, getDataObject, getString } from "../core/utils/DataObjectUtil";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: DataObject, event: Event | null) => void;

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeExtension";
const HIT_PROCESSING_TIMER_INTERVAL_MS = 500;

// Implementation
export class EdgeExtension implements Extension {
  private _isActive: boolean = false;
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
  private hitProcessingTimer: NodeJS.Timeout | null = null;

  public get name(): string {
    return EdgeConstants.EXTENSION_NAME;
  }

  public get version(): string {
    return EdgeConstants.EXTENSION_VERSION;
  }

  /**
   * Boots the Edge extension.
   * @param extensionContainer ExtensionContainer
   * @param serviceLookup ServiceLookup
   */
  async onRegister(
    extensionContainer: ExtensionContainer,
    serviceLookup: ServiceLookup
  ): Promise<void> {
    this.container = extensionContainer;
    this.dispatchFn = this.dispatchEvent.bind(this);
    this.createSharedState = this.createXDMSharedState.bind(this);

    this.serviceLookup = serviceLookup;
    this.dataStore = serviceLookup.getService("dataStore");

    this.consentManager = new ConsentManager(this.dataStore, this.dispatchFn);
    this.identityManager = new IdentityManager(
      this.dataStore,
      this.dispatchIdentityResponseEvent.bind(this)
    );
    this.locationHintManager = new LocationHintManager(this.dataStore);
    this.stateStoreManager = new StateStoreManager(this.dataStore);

    this.edgeStateManager = new EdgeStateManager(
      this.createSharedState,
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
    this._isActive = true;

    this.registerListeners();

    return Promise.all([this.edgeStateManager.bootUp(), this.edgeResponseManager.bootUp()])
      .then(() => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Edge extension bootUp complete");
        Promise.resolve();
      })
      .catch((error) => {
        Log.error(LOG_SOURCE, LOG_TAG, `Edge extension bootUp failed with error:(${error})`);
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
    if (this.isActive()) {
      // dispatch the event to the event hub
      this.container?.dispatch(event);
    }
  }

  /**
   * Returns the Experience Cloud ID (ECID) if available.
   * If the ECID is not available, then it sends an edge request to fetch the ECID.
   * @returns Promise<string | null>
   */
  getExperienceCloudId(event: Event): void {
    Log.debug(LOG_SOURCE, LOG_TAG, "getExperienceCloudId() - Getting ECID.");
    const ecid = this.edgeStateManager?.getEcid() ?? null;

    if (!isNullOrEmptyString(ecid)) {
      Log.verbose(LOG_SOURCE, LOG_TAG, `getExperienceCloudId() - Returning ECID: (${ecid}).`);

      this.dispatchIdentityResponseEvent(event.uuid, ecid);
    } else {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "getECID() - ECID is not set. Requesting ECID from Edge server."
      );

      this.sendEventForIdentity(event.uuid);
    }
  }

  dispatchIdentityResponseEvent(requestId: string, ecid: string | null): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `dispatchIdentityResponseEvent() - Dispatching identity response event with ECID: (${ecid}).`
    );

    const eventData = EventData.buildFrom({
      [EdgeConstants.EventData.Keys.ECID]: ecid,
    });

    const responseEvent = Event.builder(
      EdgeConstants.Event.Name.IDENTITY_ECID_RESPONSE,
      EventType.IDENTITY,
      EventSource.RESPONSE_IDENTITY,
      eventData
    )
      .setResponseId(requestId)
      .setParentId(requestId)
      .build();

    this.dispatchEvent(responseEvent);
  }

  /**
   * Sends the event data to the edge server
   * @param data Object containing the event data
   */
  sendEvent(event: Event): void {
    const eventData = event.data;

    if (!eventData) {
      Log.error(LOG_SOURCE, LOG_TAG, `sendEvent() - Event data(${eventData}) is invalid.`);
      return;
    }

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      "sendEvent() - Received event with data: " + eventData.toString()
    );

    const xdm = eventData.getDataObject("xdm") ?? {};
    const config = eventData.getDataObject("config") ?? {};
    eventData.removeData("config");

    const datastreamConfigOverride = getDataObject(config, "datastreamConfigOverride");
    const datastreamIdOverride = getString(config, "datastreamIdOverride");
    let hitTimestamp = getNumber(xdm, "timestamp");

    if (!hitTimestamp) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "sendEvent() - Adding timestamp to the event data, since timestamp not present."
      );
      hitTimestamp = Date.now();
      xdm["timestamp"] = hitTimestamp;
    }

    const edgeHitBuilder = EdgeHit.builder(event.uuid, eventData.getData(), hitTimestamp);

    if (datastreamConfigOverride) {
      edgeHitBuilder.addMeta("configOverrides", datastreamConfigOverride);
    }

    if (datastreamIdOverride) {
      edgeHitBuilder.setDatastreamIdOverride(datastreamIdOverride);
    }

    this.processHitAndStartTimer(edgeHitBuilder.build());
  }

  /**
   * Sends the consent data to the edge server
   * @param consent Object containing the consent data
   */
  setConsent(event: Event): void {
    const eventData = event.data;

    if (!eventData) {
      Log.error(LOG_SOURCE, LOG_TAG, `setConsent() - Event data(${eventData}) is invalid.`);
      return;
    }

    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      "setConsent() - Received event with data: " + eventData.toString()
    );

    const consentHit = EdgeHit.builder(event.uuid, eventData.getData(), Date.now())
      .setType(EdgeHitType.CONSENT)
      .build();

    this.processHitAndStartTimer(consentHit);
  }

  private processHitAndStartTimer(hit: EdgeHit): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `processHitAndStartTimer() - queue hit: (${JSON.stringify(hit)})`
    );
    this.hitProcessor?.queueHit(hit);
    this.hitProcessor?.process();

    this.startHitProcessingTimer();
  }

  /**
   * Returns the status of the Edge extension.
   * @returns boolean true if the extension is active, false otherwise.
   */
  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Un-registers the Edge extension.
   */
  onUnregister(): void {
    this._isActive = false;
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
    this.cancelHitProcessingTimer();
  }

  /**
   * Sends an edge request to fetch the ECID.
   * This event is sent only once when the getECID() is called
   * and the ECID is not available.
   */
  private sendEventForIdentity(requestEventId: string): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `sendEventForIdentity() - Sending edge request (requestId:${requestEventId}) to fetch Identity.`
    );
    const identityHit = EdgeHit.builder(requestEventId, {}, Date.now())
      .setType(EdgeHitType.EDGE)
      .build();

    // add the event to the list of events waiting for identity response
    this.identityManager?.addEventWaitingForIdentityResponse(requestEventId);

    this.processHitAndStartTimer(identityHit);
  }

  /**
   * Registers the listeners for the Edge extension.
   */
  private registerListeners() {
    Log.debug(EdgeConstants.EXTENSION_NAME, LOG_TAG, "registerListeners() - Registering listeners");

    // if the container is not available, then return
    if (!this.container) {
      Log.error(LOG_SOURCE, LOG_TAG, "registerListeners() - Container is not available.");
      return;
    }

    this.container.registerEventListener(EventType.EDGE, EventSource.REQUEST_CONTENT, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
      if (this.isActive()) {
        const eventData = event.data;

        if (eventData) {
          Log.debug(LOG_SOURCE, LOG_TAG, "Received data: " + safeStringify(eventData));
          this.sendEvent(event);
        }
      }
    });

    this.container.registerEventListener(EventType.HUB, EventSource.SHARED_STATE, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received event: " + event.toString());
      if (this.isActive()) {
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

    this.container.registerEventListener(
      EventType.IDENTITY,
      EventSource.REQUEST_IDENTITY,
      (event) => {
        Log.debug(LOG_SOURCE, LOG_TAG, "Received request identity event: " + event.toString());
        if (this.isActive()) {
          this.getExperienceCloudId(event);
        }
      }
    );

    this.container.registerEventListener(EventType.CONSENT, EventSource.SET_CONSENT, (event) => {
      Log.debug(LOG_SOURCE, LOG_TAG, "Received set consent event: " + event.toString());
      if (this.isActive()) {
        const eventData = event.data;

        if (eventData) {
          Log.debug(LOG_SOURCE, LOG_TAG, "Received data: " + safeStringify(eventData));
          this.setConsent(event);
        }
      }
    });
  }

  /**
   * Starts the hit processing timer.
   * This timer will process the hits every 500ms.
   * This method is called when the Edge extension is registered.
   */
  startHitProcessingTimer() {
    Log.verbose(LOG_SOURCE, LOG_TAG, "startHitProcessingTimer() - Starting hit processing timer.");
    if (this.hitProcessingTimer) {
      return;
    }

    this.hitProcessingTimer = setInterval(() => {
      if (!this.isActive()) {
        this.cancelHitProcessingTimer();
        return;
      }

      if (this.consentManager?.getCollectConsent() === ConsentValue.PENDING) {
        this.cancelHitProcessingTimer();
        return;
      }

      if (this.hitProcessor?.isQueueEmpty() ?? true) {
        this.cancelHitProcessingTimer();
        return;
      }

      this.hitProcessor?.process();
    }, HIT_PROCESSING_TIMER_INTERVAL_MS);
  }

  /**
   * Cancels the hit processing timer.
   * The timer is cleared when the Edge extension is unregistered.
   */
  cancelHitProcessingTimer() {
    if (this.hitProcessingTimer) {
      clearInterval(this.hitProcessingTimer);
      this.hitProcessingTimer = null;
      Log.verbose(LOG_SOURCE, LOG_TAG, "cancelHitProcessingTimer() - Timer successfully canceled.");
    }
  }
}
