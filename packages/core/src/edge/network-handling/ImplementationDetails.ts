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

import { EdgeConstants } from "../EdgeConstants";
import { DataObject } from "../../core/eventhub/EventData";

const IMPLEMENTATION_DETAILS = EdgeConstants.Request.ImplementationDetails;

/**
 * Attempts to get @adobe/kepler-aepmedia version if the package is installed.
 * @returns Media package version or undefined if not found
 */
function getAepMediaVersion(): string | undefined {
  try {
    const media = require("@adobe/kepler-aepmedia");
    return media?.Media?.EXTENSION?.version ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Builds the implementation details version string from aepmedia and aepcore package versions.
 * Format: "aepmedia-1.x.x + aepcore-1.x.x". Omits any package part if its version is not found.
 */
function getImplementationDetailsVersion(): string {
  const aepmediaVersion = getAepMediaVersion();
  const aepcoreVersion = EdgeConstants.EXTENSION_VERSION;
  const parts: string[] = [];
  if (aepmediaVersion) {
    parts.push(`aepmedia-${aepmediaVersion}`);
  }
  if (aepcoreVersion) {
    parts.push(`aepcore-${aepcoreVersion}`);
  }
  return parts.length > 0 ? parts.join(" + ") : "";
}

/**
 * Returns the implementation details object.
 * @returns DataObject
 */
export function getImplementationDetails(): DataObject {
  return {
    name: IMPLEMENTATION_DETAILS.NAME,
    version: getImplementationDetailsVersion(),
    environment: IMPLEMENTATION_DETAILS.ENVIRONMENT,
  };
}
