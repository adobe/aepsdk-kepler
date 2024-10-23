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
import { Extension, ExtensionContainer } from "../core/extension";
import { DataStore, ServiceLookup } from "../core/services";
import { ConsentManager } from "./consent/ConsentManager";
import { EdgeConstants } from "./EdgeConstants";
import { IdentityManager } from "./identity/IdentityManager";
import { Log } from "../core/utils/Log";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: Map<string, any>, event: Event | null) => void;

const LOG_TAG = "EdgeImpl";

// Implementation
export class EdgeImpl implements Edge {
  private isActive: boolean = false;
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private dataStore: DataStore | null = null;
  private consentManager: ConsentManager | null = null;
  private identityManager: IdentityManager | null = null;
  private dispatchFn: DispatchFn | null = null;
  private createXDMSharedState: createXDMSharedState | null = null;

  public version: string = EdgeConstants.EXTENSION_VERSION;
  public name: string = EdgeConstants.EXTENSION_NAME;

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): void {
    this.container = extensionContainer;
    this.dispatchFn = this.container.dispatch;
    this.createXDMSharedState = this.container.createXDMSharedState;

    this.serviceLookup = serviceLookup;
    this.dataStore = serviceLookup.getService("dataStore");

    this.consentManager = new ConsentManager(this.dataStore);
    this.identityManager = new IdentityManager(this.dataStore);
    this.isActive = true;

    this._registerListeners();
  }

  sendEvent(xdm: Map<string, object>, data: Map<string, object>): void {}

  setConsent(consent: Map<string, object>): void {
    //TODO: implement the logic here
  }

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
      if (this.isActive) {
        //TODO: implement the logic here
      }
    });
  }

  onUnregister(): void {
    this.isActive = false;
    this.container = null;
    this.serviceLookup = null;
  }

  _createXDMSharedState(): void {
    const state = new Map<string, any>();
    // identity Map
    const identityMap = this.identityManager?.getIdentityMap();
    if (identityMap) {
      state.set(EdgeConstants.XDMKey.IDENTITY_MAP, identityMap);
    }

    // TODO: Add consents data to the state

    this.createXDMSharedState?.(state, null);
  }
}
