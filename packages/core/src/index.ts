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
import { SharedStateManager } from "./core/sharedstate/SharedStateManager";
import { isExtension, createExtensionContainer } from "./core/extension";
import { createEventHub } from "./core/eventhub";
import { serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { LogLevel } from "./core/services";
import { configuration } from "./configuration";
import { edge } from "./edge";
import { registerPlatformService } from "./platform-kepler";
import { DataObject } from "./core/eventhub/EventData";
import { CoreConstants } from "./core/CoreConstants";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SDKParams {
  // TODO: we will enable this in the future for registering other optional extensions, such as Media, AJO, etc.
  // extensions?: Array<Extension>;

  config?: Map<string, any>;
  // logLevel?: LogLevel;

  // The tennant paramater will be enabled in the future for the contianerlization support.
  // tenants?: Array<string>;
}

const LOG_TAG = "Index";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

export const AEPSDK = {
  version: "1.0.0" as const,

  start(params?: SDKParams): void {
    try {
      _start(params);
    } catch (e) {
      Log.error(LOG_SOURCE, LOG_TAG, "start() - Failed to initialize the SDK: " + e);
    }
  },

  setLogLevel(logLevel: LogLevel): void {
    serviceLookup.getService("logging").setLogLevel(logLevel);
  },

  updateConfiguration(configuration: Record<string, any>): void {
    configuration.updateConfiguration(configuration);
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

function _start(params?: SDKParams): void {
  Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Registering platform services.");
  registerPlatformService();

  const eventHub = createEventHub();
  const sharedStateManager = new SharedStateManager();

  // Add the event processor to reprocess events, such as evaluating rules.
  // const processor: EventProcessor = (event: Event) => {
  //   return event;
  // };
  // eventHub.registerEventProcessor(processor);

  if (isExtension(configuration)) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Registering the Configuration extension.");
    configuration.onRegister(
      createExtensionContainer(eventHub, configuration.name, sharedStateManager),
      serviceLookup
    );
  }
  if (isExtension(edge)) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Registering the Edge extension.");
    edge.onRegister(
      createExtensionContainer(eventHub, edge.name, sharedStateManager),
      serviceLookup
    );
  }

  // TODO: enalbe this in the future for registering other optional extensions.
  // params?.extenions?.forEach(extenion => {
  //     extension.onRegister(new ExtensionContainerImpl(eventHub, extension.name, sharedStateManager), serviceLookup);
  //     Log.debug("Extension registered: " + extension.name);
  // });

  eventHub.start();

  const config = params?.config;
  if (config) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Updating SDK configuration.");
    configuration.updateConfiguration(config);
  }
  Log.debug(LOG_SOURCE, LOG_TAG, "_start() - SDK initialized succesfully!");
}

export { edge };

export {
  HttpMethod,
  asyncRequest,
  type NetworkRequest,
  type BodyType,
  type HttpConnection,
} from "./core/utils/networking";
