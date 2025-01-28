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

import { EdgeHit } from "../../src/edge/EdgeHit";
import { EdgeHitQueue } from "../../src/edge/EdgeHitQueue";

describe("EdgeHitQueue tests", () => {
  test("EdgeHitQueue should be defined", () => {
    const edgeHitQueue = new EdgeHitQueue();
    expect(edgeHitQueue).toBeDefined();
    expect(edgeHitQueue.isEmpty()).toBe(true);
    expect(edgeHitQueue.size()).toBe(0);
    expect(edgeHitQueue.peek()).toBe(null);
    expect(edgeHitQueue.popFront()).toBe(null);
  });

  test("EdgeHitQueue queue valid hit, will add it to the back of the queue", () => {
    const edgeHitQueue = new EdgeHitQueue();
    const edgeHit1 = EdgeHit.builder("requestId1", {}, Date.now()).build();
    edgeHitQueue.push(edgeHit1);

    const edgeHit2 = EdgeHit.builder("requestId2", {}, Date.now()).build();
    edgeHitQueue.push(edgeHit2);

    expect(edgeHitQueue.peek()).toBe(edgeHit1);
    expect(edgeHitQueue.size()).toBe(2);
    expect(edgeHitQueue.isEmpty()).toBe(false);
  });

  test("EdgeHitQueue popFront returns null when no hit queued", () => {
    const edgeHitQueue = new EdgeHitQueue();
    expect(edgeHitQueue.popFront()).toBe(null);
  });

  test("EdgeHitQueue popFront returns the hit and removes it from the queue.", () => {
    const edgeHitQueue = new EdgeHitQueue();
    const edgeHit = EdgeHit.builder("requestId1", {}, Date.now()).build();

    edgeHitQueue.push(edgeHit);
    expect(edgeHitQueue.size()).toBe(1);

    expect(edgeHitQueue.popFront()).toBe(edgeHit);
    expect(edgeHitQueue.size()).toBe(0);
    expect(edgeHitQueue.isEmpty()).toBe(true);
  });

  test("EdgeHitQueue peek with no hit, returns null", () => {
    const edgeHitQueue = new EdgeHitQueue();
    expect(edgeHitQueue.peek()).toBe(null);
  });

  test("EdgeHitQueue peek with multiple hits, returns the first hit without removing it from the queue", () => {
    const edgeHitQueue = new EdgeHitQueue();
    const edgeHit = EdgeHit.builder("requestId1", {}, Date.now()).build();

    edgeHitQueue.push(edgeHit);
    expect(edgeHitQueue.peek()).toBe(edgeHit);
  });
});
