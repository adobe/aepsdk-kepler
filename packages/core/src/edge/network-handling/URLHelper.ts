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

import { EdgeHit } from "../EdgeHit";
import { EdgeConstants } from "../EdgeConstants";
import { Log } from "../../core/utils/Log";
import { isNullOrEmptyString } from "../../core/utils/StringUtil";
import { EdgeHitType } from "../EdgeHit";

const LOG_SOURCE = EdgeConstants.EXTENSION_NAME;
const LOG_TAG = "URLHelper";

const SCHEME = EdgeConstants.Request.Url.SCHEME;
const PATH = EdgeConstants.Request.Path;
const URL = EdgeConstants.Request.Url;

/**
 * Returns the URL for the hit based on the hit type.
 * @param hit EdgeHit
 * @param locationHint Location hint to be used for the request.
 * @returns string The URL for the hit.
 */
export function getURLForHit(
  datastreamId: string,
  hit: EdgeHit,
  domain: string | null,
  locationHint: string | null = null
): string {
  Log.verbose(LOG_SOURCE, LOG_TAG, `getURLForHit() - configID: ${datastreamId}`);

  const domainToUse = isNullOrEmptyString(domain) ? URL.DEFAULT : domain;

  // create the base url
  const baseUrl = SCHEME + domainToUse + PATH.PREFIX;

  // create the location hint path
  const locationHintPath = isNullOrEmptyString(locationHint) ? "" : `/${locationHint}`;

  // create the path
  const overrideEdgePath = hit.path;
  const edgePath = isNullOrEmptyString(overrideEdgePath) ? PATH.INTERACT : overrideEdgePath;
  const path = hit.type === EdgeHitType.CONSENT ? PATH.CONSENT : edgePath;

  // create the query string
  const requestId = hit.requestId;
  const datastreamIdToUse = isNullOrEmptyString(hit.datastreamIdOverride)
    ? datastreamId
    : hit.datastreamIdOverride;

  const query = `?configId=${datastreamIdToUse}&requestId=${requestId}`;

  // create the full url
  const url = baseUrl + locationHintPath + path + query;

  return url;
}
