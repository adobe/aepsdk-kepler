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

import { Log } from "@adobe/vega-aepcore/dist/core/utils/Log";
import { MediaConstants } from "./MediaConstants";
import { safeStringify } from "@adobe/vega-aepcore/dist/core/utils/common";
import { SharedStateResult } from "@adobe/vega-aepcore/dist/core/sharedstate/SharedStateResult";
import { getString } from "@adobe/vega-aepcore/dist/core/utils/DataObjectUtil";

const LOG_SOURCE = MediaConstants.EXTENSION_NAME;
const LOG_TAG = "MediaState";

export class MediaState {
  private _collectConsent: string | undefined;

  public get collectConsent(): string | undefined {
    return this._collectConsent;
  }

  public updateEdgeState(edgeSharedStateResult: SharedStateResult | null | undefined): void {
    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `updateEdgeState() - Received Edge Shared state update with data: \n ${safeStringify(
        edgeSharedStateResult,
        null,
        2
      )}`
    );

    if (!edgeSharedStateResult) {
      return;
    }

    const edgeSharedStateData = edgeSharedStateResult.value?.getData() ?? {};

    const collectConsentValue = getString(
      edgeSharedStateData,
      MediaConstants.EventDataKeys.CONSENT_COLLECT
    );

    if (!collectConsentValue) {
      Log.verbose(LOG_SOURCE, LOG_TAG, `updateEdgeState() - No collect consent value found`);
      return;
    }

    this._collectConsent = collectConsentValue;

    Log.verbose(
      LOG_SOURCE,
      LOG_TAG,
      `updateEdgeState() - Updated collect consent value to (${this._collectConsent})`
    );
  }
}
