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
import { Configuration } from ".";
import { Event, EventType, EventSource, EventData } from "../core/eventhub";
import { Extension, ExtensionContainer } from "../core/extension";
import { Log } from "../core/utils/Log";
import { ServiceLookup } from "../core/services";
import {
  EXTENSION_NAME,
  EXTENSION_VERSION,
  UPDATE_CONFIGURATION_EVENT_KEY,
  UPDATE_CONFIGURATION_EVENT_NAME,
} from "./Constants";

const LOG_EXTENSION = EXTENSION_NAME;
const LOG_TAG = "ConfigurationImpl";

// Implementation
export class ConfigurationImpl implements Configuration, Extension {
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private isRegistered: boolean = false;

  public get name(): string {
    return EXTENSION_NAME;
  }

  public get version(): string {
    return EXTENSION_VERSION;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfiguration(configuration: Record<string, any>): void {
    if (!this.isRegistered) {
      Log.error(LOG_EXTENSION, LOG_TAG, "The Configuration extension is not registered.");
      return;
    }
    const data = EventData.buildFrom({
      [UPDATE_CONFIGURATION_EVENT_KEY]: configuration,
    });

    if (data === null) {
      Log.error(LOG_EXTENSION, LOG_TAG, "Configuration data is malformatted.");
      return;
    }

    this.container?.dispatch(
      new Event(
        UPDATE_CONFIGURATION_EVENT_NAME,
        EventType.CONFIGURATION,
        EventSource.REQUEST_CONTENT,
        data
      )
    );
  }

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): Promise<void> {
    this.container = extensionContainer;
    this.serviceLookup = serviceLookup;

    this.isRegistered = true;

    this.container.registerEventListener(
      EventType.CONFIGURATION,
      EventSource.REQUEST_CONTENT,
      (event) => {
        const configObj = event.data?.getDataObject(UPDATE_CONFIGURATION_EVENT_KEY);
        if (!configObj) {
          Log.error(LOG_EXTENSION, LOG_TAG, "Configuration data is not found.");
          return;
        }
        const state = EventData.buildFrom(configObj) as EventData;
        this.container?.createXDMSharedState(state, event);
      }
    );
    return Promise.resolve();
  }
}
