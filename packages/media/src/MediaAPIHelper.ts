/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { Log } from "@adobe/kepler-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";
import {
  buildDataObject,
  getDataObject,
  getString,
} from "@adobe/kepler-aepcore/dist/core/utils/DataObjectUtil";
import { EventData } from "@adobe/kepler-aepcore/dist/core/eventhub";

const LOG_EXTENSION = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaAPIHelper";

export function isValidMediaXDMData(eventData: EventData | null): boolean {
  const data = eventData?.getData() ?? null;

  if (!data) {
    Log.warning(LOG_EXTENSION, LOG_TAG, `isValidMediaXDMData() - Invalid media data: ${data}`);
    return false;
  }

  const dataObj = buildDataObject(JSON.stringify(data));
  if (!dataObj) {
    Log.warning(`isValidMediaXDMData() - Invalid media data: ${data}`, LOG_EXTENSION, LOG_TAG);
    return false;
  }

  const xdmDataObj = getDataObject(dataObj, "xdm");
  if (!xdmDataObj) {
    Log.warning(LOG_EXTENSION, LOG_TAG, `isValidMediaXDMData() - Invalid media data: ${data}`);
    return false;
  }

  const mediaEventType = getString(xdmDataObj, MediaConstants.EventDataKeys.EVENT_TYPE) ?? "";

  if (!isValidMediaEvent(mediaEventType)) {
    Log.warning(
      LOG_EXTENSION,
      LOG_TAG,
      `isValidMediaXDMData() - Invalid media event type: ${JSON.stringify(mediaEventType)}`
    );
    return false;
  }

  return true;
}

export function isValidMediaEvent(eventType: string | null): boolean {
  if (!eventType) {
    return false;
  }

  if (!(Object.values(MediaConstants.EventType) as string[]).includes(eventType ?? "")) {
    return false;
  }

  return true;
}
