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
import { UPDATE_CONFIRGURATION } from "./Constants";

const LOG_EXTENSION = "Configuration";
const LOG_TAG = "ConfigurationImpl";

const EXTENSION_NAME = "com.adobe.marketing.configuration";
const EXTENSION_VERSION = "1.0.0";

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
    data.set(UPDATE_CONFIRGURATION.DATA_KEY, configuration);
    this.container?.dispatch(
      new Event(
        UPDATE_CONFIRGURATION.EVENT_NAME,
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
        const configMap = event.data?.get(UPDATE_CONFIRGURATION.DATA_KEY);
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
