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
import { serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { LogLevel } from "./core/services";
import { configuration as configurationExtension } from "./configuration";
import { edge } from "./edge";
import { DataObject } from "./core/eventhub/EventData";
import { CoreConstants } from "./core/CoreConstants";
import { Extension } from "./core/extension";
import { initializeSDK } from "./initializeSDK";

const LOG_TAG = "Index";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

export { registerService, type DataStore } from "./core/services";
export { Log } from "./core/utils/Log";

export interface InitOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: Record<string, any>;
  logLevel?: LogLevel;
  extensions?: Array<Extension>;
}

export const AEPSDK = {
  version: "1.0.0" as const,

  /**
   * Initializes the SDK with the given parameters. 
   * This function needs to be called prior to calling any other SDK functions.
   * 
   * @param options the InitOptions passed to the SDK.
   */
  initialize(options?: InitOptions): Promise<void> {
    try {
      return initializeSDK(options);
    } catch (e) {
      Log.error(LOG_SOURCE, LOG_TAG, "start() - Failed to initialize the SDK: " + e);
    }
    return Promise.reject("Failed to initialize the SDK.");
  },

  /**
   * Sets the log level for the SDK logs.
   * 
   * @param logLevel the log level to be set.
   */
  setLogLevel(logLevel: LogLevel): void {
    serviceLookup.getService("logging").setLogLevel(logLevel);
  },

  /**
   * 
   * @returns the current log level for the SDK logs.
   */
  getLogLevel(): LogLevel {
    return serviceLookup.getService("logging").getLogLevel();
  },

  /**
   * Updates the SDK configuration.
   * 
   * @param configuration the configuration object to be passed to the SDK.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfiguration(configuration: Record<string, any>): void {
    configurationExtension.updateConfiguration(configuration);
  },

  sendEvent(event: DataObject): void {
    edge.sendEvent(event);
  },

  setConsent(consent: DataObject): void {
    edge.setConsent(consent);
  },

  getExperienceCloudId(): Promise<string | null> {
    return edge.getExperienceCloudId();
  },
};