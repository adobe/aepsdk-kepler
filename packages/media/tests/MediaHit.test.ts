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

import { MediaHit } from "../src/MediaHit";

describe("MediaHit tests", () => {
  test("MediaHit should be defined", () => {
    const mediaHit = new MediaHit("testPlayerId", "testParentId", "testEventType", 123456, {
      xdm: "data",
    });
    expect(mediaHit).toBeDefined();
    expect(mediaHit.playerId).toBe("testPlayerId");
    expect(mediaHit.parentId).toBe("testParentId");
    expect(mediaHit.eventType).toBe("testEventType");
    expect(mediaHit.timestamp).toBe(123456);
    expect(mediaHit.data).toEqual({ xdm: "data" });
  });
});
