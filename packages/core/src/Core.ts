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
import { createExtensionContainer, ExtensionContainer, type Extension } from "./core/extension";
import { createEventHub, EventData, EventHub } from "./core/eventhub";
import { ServiceLookup, serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { configuration } from "./configuration";
import { edge } from "./edge";
import {
  CoreConstants,
  eventHubPlaceHolderExtensionConstants,
  WRAPPER_NONE,
} from "./core/CoreConstants";
import { InitOptions } from ".";
import { EventDispatcher, EventDispatcherInternal } from "./core/eventhub";
import { safeStringify } from "./core/utils/common";

const eventDispatcher = new EventDispatcherInternal();

export function getEventDispatcher(): EventDispatcher {
  return eventDispatcher;
}

const LOG_TAG = "Core";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

let isStarted = false;
let eventHub = createEventHub();

type ExtensionInfo = { name: string; version: string };

const eventHubPlaceHolderExtension = new (class implements Extension {
  readonly version = eventHubPlaceHolderExtensionConstants.VERSION;
  readonly name = eventHubPlaceHolderExtensionConstants.EXTENSION_NAME;

  private container: ExtensionContainer | null = null;
  private serviceLookup: ServiceLookup | null = null;

  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): Promise<void> {
    this.container = extensionContainer;
    this.serviceLookup = serviceLookup;
    return Promise.resolve();
  }

  createSharedStateForRegisteredExtensions(extensionInfoList: ExtensionInfo[]): void {
    const state = EventData.buildFrom({
      version: eventHubPlaceHolderExtensionConstants.VERSION,
      wrapper: {
        type: WRAPPER_NONE.TYPE,
        friendlyName: WRAPPER_NONE.FRIENDLY_NAME,
      },
      extensions: extensionInfoList,
    });
    if (state) {
      this.container?.createXDMSharedState(state, null);
    }
  }
})();

export async function initializeSDK(options?: InitOptions): Promise<void> {
  if (isStarted) {
    Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - SDK has already been initialized.");
    return Promise.resolve();
  } else {
    isStarted = true;
  }

  Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - Registering platform services.");

  const sharedStateManager = new SharedStateManager();
  eventDispatcher.setEventHub(eventHub);

  const extensions: Extension[] = [
    eventHubPlaceHolderExtension,
    configuration.EXTENSION,
    edge.EXTENSION,
  ];

  if (options?.extensions) {
    extensions.push(...options.extensions);
  }

  const registeredExtensionInfoList = await registerExtensions(
    eventHub,
    sharedStateManager,
    extensions
  );

  eventHub.start();

  eventHubPlaceHolderExtension.createSharedStateForRegisteredExtensions(
    registeredExtensionInfoList
  );

  if (options?.config) {
    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `initializeSDK() - Updating SDK configuration: ${safeStringify(options.config, null, 2)}`
    );
    configuration.updateConfiguration(options.config);
  }

  if (options?.logLevel) {
    Log.debug(
      LOG_SOURCE,
      LOG_TAG,
      `initializeSDK() - Setting SDK log level to: (${options.logLevel}) `
    );
    serviceLookup.getService("logging").setLogLevel(options.logLevel);
  }

  Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - SDK initialized successfully!");
}

async function registerExtensions(
  eventHub: EventHub,
  sharedStateManager: SharedStateManager,
  extensions: Extension[]
): Promise<Array<ExtensionInfo>> {
  const registeredExtensionInfoList: {
    name: string;
    version: string;
  }[] = [];

  const onRegisterPromises: Promise<void>[] = [];

  extensions.forEach((extension) => {
    Log.debug(LOG_SOURCE, LOG_TAG, `initializeSDK() - Registering extension: (${extension.name})`);

    try {
      onRegisterPromises.push(
        extension.onRegister(
          createExtensionContainer(eventHub, extension.name, sharedStateManager),
          serviceLookup
        )
      );

      if (extension.name !== eventHubPlaceHolderExtensionConstants.EXTENSION_NAME) {
        registeredExtensionInfoList.push({
          name: extension.name,
          version: extension.version,
        });
      }
    } catch (error) {
      Log.error(
        LOG_SOURCE,
        LOG_TAG,
        `initializeSDK() - Failed to register extension: (${extension.name}), error: ${
          (error as Error).message
        }`
      );
    }
  });

  await Promise.all(onRegisterPromises);

  return registeredExtensionInfoList;
}

// It's only used in the test file
export function _resetSDK(): EventHub {
  isStarted = false;
  eventHub = createEventHub();
  return eventHub;
}
export function _resetEventDispatcher(eventHub: EventHub) {
  eventDispatcher.setEventHub(eventHub);
}
