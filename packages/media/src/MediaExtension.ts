/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { DataObject } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";
import { Event, EventType, EventSource } from "@adobe/kepler-aepcore/dist/core/eventhub";
import { ExtensionContainer, Extension } from "@adobe/kepler-aepcore/dist/core/extension";
import { ServiceLookup } from "@adobe/kepler-aepcore/dist/core/services";
import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";

export type DispatchFn = (event: Event) => void;
export type createXDMSharedState = (state: DataObject, event: Event | null) => void;

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaExtension";

// Implementation
export class MediaExtension implements Extension {
  private _isActive: boolean = false;
  private container: ExtensionContainer | null = null;

  public get name(): string {
    return MediaConstants.EXTENSION_NAME;
  }

  public get version(): string {
    return MediaConstants.EXTENSION_VERSION;
  }

  /**
   * Boots the Media extension.
   * @param extensionContainer ExtensionContainer
   * @param serviceLookup ServiceLookup
   */
  async onRegister(
    extensionContainer: ExtensionContainer,
    serviceLookup: ServiceLookup
  ): Promise<void> {
    Log.verbose(LOG_SOURCE, LOG_TAG, "onRegister() - Registering Media extension.");
    this._isActive = true;
    this.container = extensionContainer;
    this.registerListeners();
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
   * Returns the status of the Media extension.
   * @returns boolean true if the extension is active, false otherwise.
   */
  isActive(): boolean {
    return this._isActive;
  }

  /**
   * Registers the listeners for the Edge extension.
   */
  private registerListeners() {}

  /**
   * Un-registers the Edge extension.
   */
  onUnregister(): void {
    this._isActive = false;
  }
}
