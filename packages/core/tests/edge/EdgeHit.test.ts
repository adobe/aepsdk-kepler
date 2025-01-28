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
  it("should create an EdgeHit with default values", () => {
    const timestamp = Date.now();
    const data = { key: "value" };
    const edgeHit = new EdgeHit("test-request-id", data, timestamp);
    expect(edgeHit.requestId).toBe("test-request-id");
    expect(edgeHit.data).toBe(data);
    expect(edgeHit.timestamp).toBe(timestamp);
    expect(edgeHit.meta).toBeNull();
    expect(edgeHit.path).toBe("");
    expect(edgeHit.type).toBe(EdgeHitType.EDGE);
    expect(edgeHit.xdm).toBeNull();
    expect(edgeHit.datastreamIdOverride).toBeNull();
  });

  it("should set and get type", () => {
    const requestId = "12345";
    const data = { key: "value" };
    const timestamp = 1620000000000;
    const edgeHit = EdgeHit.builder(requestId, data, timestamp)
      .setType(EdgeHitType.CONSENT)
      .build();
    expect(edgeHit.type).toBe(EdgeHitType.CONSENT);
  });

  it("should set and get meta data", () => {
    const requestId = "12345";
    const data = { key: "value" };
    const timestamp = 1620000000000;
    const meta: DataObject = { key: "value" };
    const edgeHit = EdgeHit.builder(requestId, data, timestamp).addMeta("key", "value").build();
    expect(edgeHit.meta).toEqual(meta);
  });

  it("should set and get path", () => {
    const requestId = "12345";
    const data = { key: "value" };
    const timestamp = 1620000000000;

    const path = "/test/path";
    const edgeHit = EdgeHit.builder(requestId, data, timestamp).setPath(path).build();
    expect(edgeHit.path).toBe(path);
  });

  it("should set and get xdm data", () => {
    const requestId = "12345";
    const data = { key: "value" };
    const timestamp = 1620000000000;

    const xdm: DataObject = { xdmKey: "xdmValue" };
    const edgeHit = EdgeHit.builder(requestId, data, timestamp).setXdm(xdm).build();
    expect(edgeHit.xdm).toEqual(xdm);
  });

  it("should set and get datastreamIdOverride", () => {
    const requestId = "12345";
    const data = { key: "value" };
    const timestamp = 1620000000000;

    const datastreamId = "override-id";
    const edgeHit = EdgeHit.builder(requestId, data, timestamp)
      .setDatastreamIdOverride(datastreamId)
      .build();
    expect(edgeHit.datastreamIdOverride).toBe(datastreamId);
  });
});
