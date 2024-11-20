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
import { createEventHub, EventData } from "./core/eventhub";
import { ServiceLookup, serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { configuration } from "./configuration";
import { edge } from "./edge";
import { CoreConstants, eventHubPlaceHolderExtensionConstants, WRAPPER_NONE } from "./core/CoreConstants";
import { InitOptions } from ".";

const LOG_TAG = "Core";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

let isStarted = false;

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

    createSharedStateForRegisteredExtensions(extensionInfoList: {
        name: string;
        version: string;
    }[]): void {
        const state = EventData.buildFrom({
            version: eventHubPlaceHolderExtensionConstants.VERSION,
            wrapper: {
                type: WRAPPER_NONE.TYPE,
                friendlyName: WRAPPER_NONE.FRIENDLY_NAME
            },
            extensions: extensionInfoList
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

    const eventHub = createEventHub();
    const sharedStateManager = new SharedStateManager();

    const onRegisterPromises: Promise<void>[] = [];

    const extensions: Extension[] = [eventHubPlaceHolderExtension, configuration.EXTENSION, edge.EXTENSION];

    if (options?.extensions) {
        extensions.push(...options.extensions);
    }
    const registeredExtensionInfoList: {
        name: string;
        version: string;
    }[] = [];

    extensions.forEach((extension) => {
        Log.debug(LOG_SOURCE, LOG_TAG, `initializeSDK() - Registering extension: ${extension.name}`);
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
                    version: extension.version
                });
            }
        } catch (error) {
            Log.error(LOG_SOURCE, LOG_TAG, `initializeSDK() - Failed to register extension: ${extension.name}, error: ${(error as Error).message}`);
        }
    });

    await Promise.all(onRegisterPromises);

    eventHub.start();

    eventHubPlaceHolderExtension.createSharedStateForRegisteredExtensions(registeredExtensionInfoList);

    if (options?.config) {
        Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - Updating SDK configuration.");
        configuration.updateConfiguration(options.config);
    }

    if (options?.logLevel) {
        Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - Updating SDK log level.");
        serviceLookup.getService("logging").setLogLevel(options.logLevel);
    }

    Log.debug(LOG_SOURCE, LOG_TAG, "initializeSDK() - SDK initialized succesfully!");
}

// It's only used in the test file
export function _resetSDK() {
    isStarted = false;
}