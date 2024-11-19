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
import { createExtensionContainer, type Extension } from "./core/extension";
import { createEventHub, EventProcessor } from "./core/eventhub";
import { serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { configuration } from "./configuration";
import { edge } from "./edge";
import { registerPlatformService } from "./platform-kepler";
import { CoreConstants } from "./core/CoreConstants";
import { InitOptions } from ".";

const LOG_TAG = "initializeSDK";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

let isStarted = false;

export async function initializeSDK(options?: InitOptions): Promise<void> {
  if (isStarted) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - SDK has already been initialized.");
    return Promise.resolve();
  } else {
    isStarted = true;
  }

  Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Registering platform services.");
  registerPlatformService();

  const eventHub = createEventHub();
  const sharedStateManager = new SharedStateManager();

  const onRegisterPromises: Promise<void>[] = [];

  // TODO: update Edge extension to follow the same convention
  const extensions: Extension[] = [configuration.EXTENSION, edge];

  if (options?.extensions) {
    extensions.push(...options.extensions);
  }

  extensions.forEach((extension) => {
    Log.debug(LOG_SOURCE, LOG_TAG, `_start() - Registering extension: ${extension.name}`);
    try {
      onRegisterPromises.push(
        extension.onRegister(
          createExtensionContainer(eventHub, extension.name, sharedStateManager),
          serviceLookup
        )
      );
    } catch (error) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `_start() - Failed to register extension: ${extension.name}, error: ${
          (error as Error).message
        }`
      );
    }
  });

  await Promise.all(onRegisterPromises);

  eventHub.start();

  if (options?.config) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Updating SDK configuration.");
    configuration.updateConfiguration(options.config);
  }

  if (options?.logLevel) {
    Log.debug(LOG_SOURCE, LOG_TAG, "_start() - Updating SDK log level.");
    serviceLookup.getService("logging").setLogLevel(options.logLevel);
  }

  Log.debug(LOG_SOURCE, LOG_TAG, "_start() - SDK initialized succesfully!");
}

// It's only used in the test file
export function _resetSDK() {
  isStarted = false;
}
