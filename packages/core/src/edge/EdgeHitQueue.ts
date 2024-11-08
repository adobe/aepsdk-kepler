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

import { EdgeHit } from "./EdgeHit";

/**
 * A FIFO queue for EdgeHit objects.
 * This queue is used to store hits that need to be sent to the Edge network.
 */
export class EdgeHitQueue {
  private queue: EdgeHit[];

  constructor() {
    this.queue = [];
  }

  /**
   * Adds a hit to the end of the queue.
   * @param hit The hit to add to the queue.
   */
  push(hit: EdgeHit) {
    this.queue.push(hit);
  }

  /**
   * Returns whether the queue is empty.
   * @returns True if the queue is empty, false otherwise.
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * Returns the number of hits in the queue.
   * @returns The number of hits in the queue.
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Returns the first hit from the queue without removing it.
   * @returns The first hit from the queue or null if the queue is empty.
   */
  peek(): EdgeHit | null {
    return this.isEmpty() ? null : this.queue[0];
  }

  /**
   * Removes and returns the first hit from the queue.
   * @returns EdgeHit The first hit from the queue
   * or null if the queue is empty.
   */
  popFront(): EdgeHit | null {
    return this.isEmpty() ? null : this.queue.shift() ?? null;
  }
}
