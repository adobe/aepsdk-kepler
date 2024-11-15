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

import { ConsentManager } from "./consent/ConsentManager";
import { IdentityManager } from "./identity/IdentityManager";
import { LocationHintManager } from "./LocationHintManager";
import { StateStoreManager } from "./StateStoreManager";
import { DataArray, DataObject, EventData } from "../core/eventhub/EventData";
import { Log } from "../core/utils/Log";
import { EdgeConstants } from "./EdgeConstants";
import { getAsDataObject, getAsString, isNullOrEmptyObject } from "../core/utils/DataTypeUtil";
import { Event } from "../core/eventhub/Event";
import { EventType } from "../core/eventhub/EventType";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeResponseManager";

const RESPONSE_DATA_KEYS = EdgeConstants.ResponseData.Keys;

export class EdgeResponseManager {
  constructor(
    private dispatchFn: (event: Event) => void,
    private identityManager: IdentityManager,
    private consentManager: ConsentManager,
    private locationHintManager: LocationHintManager,
    private stateStoreManager: StateStoreManager
  ) {}

  handleEdgeResponse(response: DataObject) {
    Log.debug(LOG_SOURCE, LOG_TAG, `handleEdgeResponse() -  ${JSON.stringify(response)}`);

    if (isNullOrEmptyObject(response)) {
      Log.verbose(LOG_SOURCE, LOG_TAG, "handleEdgeResponse() - Edge response is empty or null.");
      return;
    }

    const handles = response[RESPONSE_DATA_KEYS.HANDLE] as DataArray;

    if (!handles) {
      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        "handleEdgeResponse() - Edge response does not contain handles."
      );
      return;
    }

    for (let i = 0; i < handles.length; i++) {
      const handle = getAsDataObject(handles[i]) ?? {};
      const type = getAsString(handle?.[RESPONSE_DATA_KEYS.TYPE]) ?? "";

      if (type === RESPONSE_DATA_KEYS.IDENTITY_RESULT) {
        this.identityManager.processEdgeResponse(handle);
      } else if (type === RESPONSE_DATA_KEYS.CONSENT_PREFERENCES) {
        this.consentManager.processEdgeResponse(handle);
      } else if (type === RESPONSE_DATA_KEYS.LOCATION_HINT_RESULT) {
        this.locationHintManager.processEdgeResponse(handle);
      } else if (type === RESPONSE_DATA_KEYS.STATE_STORE) {
        this.stateStoreManager.processEdgeResponse(handle);
      }

      Log.verbose(
        LOG_SOURCE,
        LOG_TAG,
        `handleEdgeResponse() - dispatching edge response to eventhub with type: (${EventType.EDGE}) source: (${type}).`
      );
      this.dispatchFn(
        new Event("AEP Response Event Handle", EventType.EDGE, type, EventData.buildFrom(handle))
      );
    }
  }
}
