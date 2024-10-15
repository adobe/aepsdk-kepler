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
import { Extension, createExtensionContainer } from "./core/extension";
import { createEventHub } from "./core/eventhub";
import { serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { configuration } from "./configuration";
import { edge } from "./edge";
import { registerPlatformService } from "./platform-kepler";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SDKParams {
  // TODO: we will enable this in the future for registering other optional extensions, such as Media, AJO, etc.
  // extensions?: Array<Extension>;

  config?: Map<string, any>;

  // The tennant paramater will be enabled in the future for the contianerlization support.
  // tenants?: Array<string>;
}

const LOG_TAG = "Index";
const LOG_EXTENSION = "Core";

export const AEPSDK = {
  version: "1.0.0" as const,

  start(params?: SDKParams): void {
    try {
      _start(params);
    } catch (e) {
      Log.error(LOG_EXTENSION, LOG_TAG, "Failed to initialize the SDK: " + e);
    }
  },

  updateConfiguration(configuration: Record<string, any>): void {
    configuration.updateConfiguration(configuration);
  },
};

function isExtension(extension: any): extension is Extension {
  return extension && extension.name && extension.onRegister;
}

function _start(params?: SDKParams): void {
  Log.debug(LOG_EXTENSION, LOG_TAG, "Start to register the platform services.");
  registerPlatformService();

  const eventHub = createEventHub();
  const sharedStateManager = new SharedStateManager();

  // Add the event processor to reprocess events, such as evaluating rules.
  // const processor: EventProcessor = (event: Event) => {
  //   return event;
  // };
  // eventHub.registerEventProcessor(processor);

  if (isExtension(configuration)) {
    Log.debug(LOG_EXTENSION, LOG_TAG, "Start to register the Configuration extension.");
    configuration.onRegister(
      createExtensionContainer(eventHub, configuration.name, sharedStateManager),
      serviceLookup
    );
  }
  if (isExtension(edge)) {
    Log.debug(LOG_EXTENSION, LOG_TAG, "Start to register the Edge extension.");
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
    Log.debug(LOG_EXTENSION, LOG_TAG, "Start to update the SDK configuration.");
    configuration.updateConfiguration(config);
  }
  Log.debug(LOG_EXTENSION, LOG_TAG, "SDK is initialized correctly.");
}

export { edge };
