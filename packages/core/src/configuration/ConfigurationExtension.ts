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
import { safeStringify } from "../core/utils/common";
import {
  EXTENSION_NAME,
  EXTENSION_VERSION,
  UPDATE_CONFIGURATION_EVENT_KEY,
  UPDATE_CONFIGURATION_EVENT_NAME,
} from "./Constants";
import { isEmptyDataObject } from "../core/utils/DataObjectUtil";

const LOG_EXTENSION = EXTENSION_NAME;
const LOG_TAG = "ConfigurationExtension";

// Implementation
export class ConfigurationExtension implements Configuration, Extension {
  readonly EXTENSION: Extension = this;

  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private isRegistered: boolean = false;

  private configuration: Record<string, unknown> = {};

  public get name(): string {
    return EXTENSION_NAME;
  }

  public get version(): string {
    return EXTENSION_VERSION;
  }

  // public API
  updateConfiguration(configuration: Record<string, unknown>): void {
    if (!this.isRegistered) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        "updateConfiguration() - The Configuration extension is not registered."
      );
      return;
    }

    Log.verbose(
      LOG_EXTENSION,
      LOG_TAG,
      `updateConfiguration() - the configruation object sent by the client: ${safeStringify(
        configuration
      )}`
    );

    const data = EventData.buildFrom({
      [UPDATE_CONFIGURATION_EVENT_KEY]: configuration,
    });

    if (!data) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        "updateConfiguration() - Configuration data is malformatted."
      );
      return;
    }

    const purifiedConfigData = data.getDataObject(UPDATE_CONFIGURATION_EVENT_KEY);

    if (!purifiedConfigData || isEmptyDataObject(purifiedConfigData)) {
      Log.error(LOG_EXTENSION, LOG_TAG, "updateConfiguration() - Configuration data is empty.");
      return;
    }

    this.container?.dispatch(
      Event.builder(
        UPDATE_CONFIGURATION_EVENT_NAME,
        EventType.CONFIGURATION,
        EventSource.REQUEST_CONTENT,
        data
      ).build()
    );
  }

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): Promise<void> {
    this.container = extensionContainer;
    this.serviceLookup = serviceLookup;

    this.isRegistered = true;

    // Register the event listener for the "update configuration" event
    this.container.registerEventListener(
      EventType.CONFIGURATION,
      EventSource.REQUEST_CONTENT,
      (event) => {
        const configObj = event.data?.getDataObject(UPDATE_CONFIGURATION_EVENT_KEY);
        if (!configObj) {
          Log.error(
            LOG_EXTENSION,
            LOG_TAG,
            "process [config.update] event - Configuration object is not found."
          );
          return;
        }

        const mergedConfiguration = this.mergeConfiguration(configObj);

        const state = EventData.buildFrom(mergedConfiguration);
        if (state) {
          this.configuration = mergedConfiguration;
          this.container?.createXDMSharedState(state, event);
        }
      }
    );
    return Promise.resolve();
  }

  private mergeConfiguration(configuration: Record<string, unknown>): Record<string, unknown> {
    return { ...this.configuration, ...configuration };
  }
}
