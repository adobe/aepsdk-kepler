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
import { CoreConstants } from "./core/CoreConstants";
import { Extension } from "./core/extension";
import { registerPlatformService } from "./platform-kepler";
import { initializeSDK } from "./Core";

const LOG_TAG = "Index";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

export interface InitOptions {
  // todo update label configuration
  config?: Record<string, unknown>;
  logLevel?: LogLevel;
  extensions?: Array<Extension>;
}

export const AEPSDK = {
  version: "1.0.0-beta.1" as const,

  /**
   * Initializes the SDK with the given parameters.
   * This function needs to be called prior to calling any other SDK functions.
   *
   * Example:
   *
   * AEPSDK.initialize({
   *  config: {
   *      "edge.configId": "xxx-xxx-xxx", // required
   *      "edge.domain": "edgeDomain", // optional
   *      "consent.default": {"collect": "y"} // optional
   *  },
   *  logLevel: LogLevel.VERBOSE
   * });
   *
   * @param options the InitOptions passed to the SDK.
   */
  initialize(options?: InitOptions): Promise<void> {
    try {
      registerPlatformService();
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
   * Returns the current logging level of the SDK.
   *
   * @returns the current log level for the SDK logs.
   */
  getLogLevel(): LogLevel {
    return serviceLookup.getService("logging").getLogLevel();
  },

  /**
   * Updates the SDK configuration.
   *
   * Example:
   *
   * AEPSDK.updateConfiguration({
   *  "edge.configId": "xxx-xxx-xxx", // required
   *  "edge.domain": "edgeDomain", // optional
   *  "consent.default": {"collect": "y"} // optional
   * });
   *
   * @param config the configuration object to be passed to the SDK.
   */
  updateConfiguration(config: Record<string, unknown>): void {
    configurationExtension.updateConfiguration(config);
  },

  /**
   * Returns the Experience Cloud ID (ECID) of the user.
   * @returns Promise<string | null>
   * @returns null if the ECID is not available.
   */
  getExperienceCloudId(): Promise<string | null> {
    return edge.getExperienceCloudId();
  },

  /**
   * Sends an event to the edge network.
   * @param event the event to be sent.
   */
  sendEvent(event: Record<string, unknown>): void {
    edge.sendEvent(event);
  },

  /**
   * Sends an event to the edge network and returns the response.
   * @param event the event to be sent.
   * @returns Promise<Array<Record<string, unknown>>>
   * @throws Error if the event data is invalid.
   * @throws Error if the event data does not contain valid non-empty XDM data.
   */
  sendEventWithResponse(event: Record<string, unknown>): Promise<Array<Record<string, unknown>>> {
    return edge.sendEventWithResponse(event);
  },

  /**
   * Sends the consent data to the edge network.
   * @param consent the consent data to be sent.
   */
  setConsent(consent: Record<string, unknown>): void {
    edge.setConsent(consent);
  },
};
