/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { getDataObject } from "../../core/utils/DataObjectUtil";
import { EdgeHit } from "../EdgeHit";
import { DataArray, DataObject } from "../../core/eventhub/EventData";
import { getImplementationDetails } from "./ImplementationDetails";
import { EdgeConstants } from "../EdgeConstants";
import { Log } from "../../core/utils/Log";
import { isNullOrEmptyObject } from "../../core/utils/DataTypeUtil";
import { getECIDQueryPayload } from "./RequestQuery";

const DATA = EdgeConstants.Request.Data;
const QUERY = DATA.Query;
const META = DATA.Meta;

const LOG_TAG = "RequestHelper";
const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;

/**
 * Creates base request object with common properties
 * @param identityMap DataObject to be sent in the request body
 * @param meta DataObject to be sent in the request body
 * @returns Base request object with common properties
 */
function createBaseRequestObject(
  identityMap: DataObject | null,
  meta: DataObject | null
): DataObject {
  const requestObj: DataObject = {
    xdm: {
      implementationDetails: getImplementationDetails(),
    },
  };

  if (!isNullOrEmptyObject(identityMap)) {
    const xdmData = getDataObject(requestObj, DATA.XDM) ?? {};
    xdmData[DATA.IDENTITY_MAP] = identityMap;
    requestObj[DATA.XDM] = xdmData;
  } else {
    requestObj[QUERY.KEY] = {
      [QUERY.IDENTITY]: getECIDQueryPayload(),
    };
  }

  if (!isNullOrEmptyObject(meta)) {
    requestObj[META.KEY] = meta;
  }

  return requestObj;
}

/**
 *
 * @param hit EdgeHit to be processed
 * @param identityMap DataObject to be sent in the request body
 * @returns requestBody string
 */
export function createEdgeRequestBody(
  hit: EdgeHit,
  identityMap: DataObject | null,
  meta: DataObject | null
): string {
  const requestObj = createBaseRequestObject(identityMap, meta);
  requestObj.events = [hit.data ?? {}];

  const requestBody = JSON.stringify(requestObj);
  Log.verbose(LOG_SOURCE, LOG_TAG, `createEdgeRequestBody() - RequestBody: ${requestBody}`);
  return requestBody;
}

/**
 *
 * @param hit EdgeHit to be processed
 * @param identityMap DataObject to be sent in the request body
 * @returns requestBody string
 */
export function createConsentRequestBody(
  hit: EdgeHit,
  identityMap: DataObject | null,
  meta: DataObject | null
): string {
  const requestObj = createBaseRequestObject(identityMap, meta);
  const consentData = (hit.data?.consent as DataArray) ?? [];

  requestObj.query = {
    ...((requestObj.query ?? {}) as DataObject),
    [QUERY.CONSENT]: {
      operation: QUERY.UPDATE,
    },
  };

  // Add Consent Data
  requestObj.consent = consentData;

  const requestBody = JSON.stringify(requestObj);
  Log.verbose(
    LOG_SOURCE,
    LOG_TAG,
    "createConsentRequestBody() - RequestBody: " + JSON.stringify(requestBody)
  );
  return requestBody;
}
