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
import { DataArray, DataObject } from "../core/eventhub/EventData";
import { Log } from "../core/utils/Log";
import { EdgeConstants } from "./EdgeConstants";
import { getAsDataObject, getAsString, isNullOrEmptyObject } from "../core/utils/DataTypeUtil";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "EdgeResponseManager";

const HANDLE = EdgeConstants.Response.Data.Handle;

export class EdgeResponseManager {
  constructor(
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

    const handles = response[HANDLE.KEY] as DataArray;

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
      const type = getAsString(handle?.[HANDLE.TYPE]) ?? "";

      if (type === HANDLE.IDENTITY_RESULT) {
        this.identityManager.processEdgeResponse(handle);
      } else if (type === HANDLE.CONSENT_PREFERENCES) {
        this.consentManager.processEdgeResponse(handle);
      } else if (type === HANDLE.LOCATION_HINT_RESULT) {
        this.locationHintManager.processEdgeResponse(handle);
      } else if (type === HANDLE.STATE_STORE) {
        this.stateStoreManager.processEdgeResponse(handle);
      }
    }
  }
}
