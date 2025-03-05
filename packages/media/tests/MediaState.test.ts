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

import { MediaState } from "../src/MediaState";
import { EventData } from "@adobe/kepler-aepcore/dist/core/eventhub/EventData";
import { MediaConstants } from "../src/MediaConstants";
import { SharedStateStatus } from "@adobe/kepler-aepcore/dist/core/sharedstate/SharedStateStatus";

describe("MediaState Tests", () => {
  test("updateEdgeState() - should update collect consent", () => {
    const mediaState = new MediaState();

    const edgeSharedStateResult = {
      status: SharedStateStatus.SET,
      value: EventData.buildFrom({
        [MediaConstants.EventDataKeys.CONSENT_COLLECT]: "n",
      }),
    };

    mediaState.updateEdgeState(edgeSharedStateResult);

    expect(mediaState.collectConsent).toBe("n");
  });

  test("updateEdgeState() - should not update collect consent if it is not set", () => {
    const mediaState = new MediaState();

    const edgeSharedStateResult = {
      status: SharedStateStatus.SET,
      value: EventData.buildFrom({}),
    };

    mediaState.updateEdgeState(edgeSharedStateResult);

    expect(mediaState.collectConsent).toBeUndefined();
  });
});
