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

import { DataObject } from "../../src/core/eventhub/EventData";
import { EdgeHit, EdgeHitType } from "../../src/edge/EdgeHit";

describe("EdgeHit tests", () => {
  test("EdgeHit builder type edge", () => {
    const testTimeStamp = Date.now();

    const edgeHit = EdgeHit.builder()
      .setRequestId("requestId")
      .setTimestamp(testTimeStamp)
      .setMeta({ metaKey: "value" })
      .setPath("custom/path/here")
      .setType(EdgeHitType.EDGE)
      .setData({ dataKey: "value" })
      .build();

    expect(edgeHit.requestId).toBe("requestId");
    expect(edgeHit.timestamp).toEqual(testTimeStamp);
    expect(edgeHit.meta as DataObject).not.toBeNull();
    expect(Object.keys(edgeHit.meta ?? {}).length).toBe(1);
    expect(edgeHit.meta?.["metaKey"]).toBe("value");
    expect(edgeHit.path).toBe("custom/path/here");
    expect(edgeHit.type).toBe(EdgeHitType.EDGE);
    expect(Object.keys(edgeHit.data ?? {}).length).toBe(1);
    expect(edgeHit.data?.["dataKey"]).toBe("value");
  });

  test("EdgeHit builder type consent", () => {
    const testTimeStamp = Date.now();

    const edgeHit = EdgeHit.builder()
      .setRequestId("requestId")
      .setTimestamp(testTimeStamp)
      .setMeta({ metaKey: "value" })
      .setPath("custom/path/here")
      .setType(EdgeHitType.CONSENT)
      .setData({ dataKey: "value" })
      .build();

    expect(edgeHit.requestId).toBe("requestId");
    expect(edgeHit.timestamp).toEqual(testTimeStamp);
    expect(edgeHit.meta as DataObject).not.toBeNull();
    expect(Object.keys(edgeHit.meta ?? {}).length).toBe(1);
    expect(edgeHit.meta?.["metaKey"]).toBe("value");
    expect(edgeHit.path).toBe("custom/path/here");
    expect(edgeHit.type).toBe(EdgeHitType.CONSENT);
    expect(edgeHit.data as DataObject).not.toBeNull();
    expect(Object.keys(edgeHit.data ?? {}).length).toBe(1);
    expect(edgeHit.data?.["dataKey"]).toBe("value");
  });

  test("EdgeHit builder no fields set", () => {
    const edgeHit = EdgeHit.builder().build();

    expect(edgeHit.requestId).toBe("");
    // If not set the timestamp is set to the time of creation of edge hit
    expect(edgeHit.timestamp <= Date.now()).toBeTruthy();
    expect(edgeHit.meta).toBeNull();
    expect(edgeHit.path).toBe("");
    expect(edgeHit.type).toBe(EdgeHitType.EDGE);
    expect(edgeHit.data).toBeNull();
  });
});
