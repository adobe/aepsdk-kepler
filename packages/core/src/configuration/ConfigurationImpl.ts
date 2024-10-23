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
import { Event, EventType, EventSource } from "../core/eventhub";
import { Extension, ExtensionContainer } from "../core/extension";
import { Log } from "../core/utils/Log";
import { ServiceLookup } from "../core/services";
import { ConfigurationConstants } from "./ConfigurationConstants";

const EXTENSION_NAME = ConfigurationConstants.EXTENSION_NAME;
const EXTENSION_VERSION = ConfigurationConstants.EXTENSION_VERSION;
const EVENT = ConfigurationConstants.Event;

const LOG_EXTENSION = EXTENSION_NAME;
const LOG_TAG = "ConfigurationImpl";

/* eslint-disable @typescript-eslint/no-explicit-any */
// Implementation
export class ConfigurationImpl implements Configuration, Extension {
  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;
  private isRegistered: boolean = false;

  private currentConfiguration: Map<string, any> = new Map();

  public get name(): string {
    return EXTENSION_NAME;
  }

  public get version(): string {
    return EXTENSION_VERSION;
  }

  updateConfiguration(configuration: Map<string, any>): void {
    if (this.isRegistered) {
      Log.error(LOG_EXTENSION, LOG_TAG, "The Configuration extension is not registered.");
      return;
    }
    const data = new Map<string, any>();
    data.set(EVENT.Data.Key.CONFIGURATION_UPDATE, configuration);
    this.container?.dispatch(
      new Event(
        EVENT.Name.CONFIGURATION_UPDATE,
        EventType.CONFIGURATION,
        EventSource.REQUEST_CONTENT,
        data
      )
    );
  }

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): void {
    this.container = extensionContainer;
    this.serviceLookup = serviceLookup;

    this.isRegistered = true;

    this.container.registerEventListener(
      EventType.CONFIGURATION,
      EventSource.REQUEST_CONTENT,
      (event) => {
        const configMap = event.data?.get(EVENT.Data.Key.CONFIGURATION_UPDATE);
        if (!configMap) {
          Log.error(LOG_EXTENSION, LOG_TAG, "Configuration data is missing.");
          return;
        }
        //TODO: We may need to validate the configuration key.
        for (const key in configMap) {
          this.currentConfiguration.set(key, configMap[key]);
        }
        this.container?.createXDMSharedState(this.currentConfiguration, event);
      }
    );
  }
}
