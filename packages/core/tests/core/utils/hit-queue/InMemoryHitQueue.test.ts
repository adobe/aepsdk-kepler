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
import { InMemoryHitQueue } from "../../../../src/core/utils/hit-queue/InMemoryHitQueue";
import { HitProcessing } from "../../../../src/core/utils/hit-queue/HitProcessing";

let hitProcessed = 0;
class MockHitProcessing implements HitProcessing<string> {
  processHit(hit: string): Promise<boolean> {
    hitProcessed++;
    return new Promise((resolve) => setTimeout(() => resolve(hit !== "fail"), 100));
  }
}

describe("InMemoryHitQueue", () => {
  let hitQueue: InMemoryHitQueue<string>;
  let mockHitProcessing: MockHitProcessing;

  beforeEach(() => {
    mockHitProcessing = new MockHitProcessing();
    hitQueue = new InMemoryHitQueue<string>(mockHitProcessing);
    hitProcessed = 0;
  });

  test("queue() - should queue a hit successfully", async () => {
    expect(hitProcessed).toBe(0);
    hitQueue.queue("testHit");
    hitQueue.queue("testHit");

    while (hitQueue.count() > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(hitProcessed).toBe(2);
  });

  test("queue() - should not process hits when suspended", () => {
    hitQueue.suspend();
    hitQueue.queue("testHit");

    expect(hitQueue.count()).toBe(1);
    expect(hitProcessed).toBe(0);
  });

  test("beginProcessing() - should process suspended hits", async () => {
    hitQueue.suspend();
    hitQueue.queue("testHit");
    hitQueue.queue("testHit");

    hitQueue.beginProcessing();

    while (hitQueue.count() > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(hitQueue.count()).toBe(0);
    expect(hitProcessed).toBe(2);
  });

  test("clear() - should clear the queue", () => {
    hitQueue.suspend();
    hitQueue.queue("testHit");
    hitQueue.clear();
    expect(hitQueue.count()).toBe(0);
    expect(hitProcessed).toBe(0);
  });

  test("close() - should close the queue", async () => {
    hitQueue.suspend();

    hitQueue.queue("testHit");
    hitQueue.queue("testHit");
    expect(hitQueue.count()).toBe(2);

    hitQueue.close();

    expect(hitQueue.count()).toBe(0);
    expect(hitProcessed).toBe(0);

    // check if the suspended flag is reset
    hitQueue.queue("testHit");
    while (hitQueue.count() > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(hitQueue.count()).toBe(0);
    expect(hitProcessed).toBe(1);
  });

  test("should retry processing on failure", async () => {
    let retries = 0;
    hitQueue = new InMemoryHitQueue<string>(
      {
        processHit(): Promise<boolean> {
          retries++;
          if (retries > 1) {
            return new Promise((resolve) => setTimeout(() => resolve(true), 2));
          }
          return new Promise((resolve) => setTimeout(() => resolve(false), 2));
        },
      },
      50
    );
    hitQueue.queue("testHit");

    while (retries < 2) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(hitQueue.count()).toBe(0);
    expect(retries).toBe(2);
  });
});
