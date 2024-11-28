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
import { Configuration } from "./Configuration";
import { Event, EventType, EventSource, EventData } from "../core/eventhub";
import { Log } from "../core/utils/Log";
import { safeStringify } from "../core/utils/common";
import {
  EXTENSION_NAME,
  UPDATE_CONFIGURATION_EVENT_KEY,
  UPDATE_CONFIGURATION_EVENT_NAME,
} from "./Constants";
import { isEmptyDataObject } from "../core/utils/DataObjectUtil";
import { Extension } from "../core/extension";
import { getEventDispatcher } from "../Core";
import { ConfigurationExtension } from "./ConfigurationExtension";

const LOG_EXTENSION = EXTENSION_NAME;
const LOG_TAG = "ConfigurationAPI";

export class ConfigurationAPI implements Configuration {
  readonly EXTENSION: Extension = new ConfigurationExtension();

  updateConfiguration(configuration: Record<string, unknown>): void {
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

    getEventDispatcher().dispatch(
      Event.builder(
        UPDATE_CONFIGURATION_EVENT_NAME,
        EventType.CONFIGURATION,
        EventSource.REQUEST_CONTENT,
        data
      ).build()
    );
  }
}

export const configuration: Configuration = new ConfigurationAPI();
