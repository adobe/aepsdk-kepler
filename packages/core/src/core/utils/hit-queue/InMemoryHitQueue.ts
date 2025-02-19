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

import { HitQueuing } from "./HitQueuing";
import { HitProcessing } from "./HitProcessing";
import { retry } from "../retry";

const MAX_QUEUE_SIZE = 100;

export class InMemoryHitQueue<T> implements HitQueuing<T> {
  private hitQueue: T[] = [];
  private isSuspended: boolean = false;
  private isProcessing: boolean = false;

  constructor(
    private readonly hitProcessing: HitProcessing<T>,
    private readonly retryIntervalMs: number = 5000
  ) {}

  /**
   * Queues an EdgeHit to be processed
   *
   * @param hit the hit to be processed
   * @return a boolean indication whether queuing the hit was successful or not
   */
  public queue(hit: T) {
    if (this.hitQueue.length >= MAX_QUEUE_SIZE) {
      this.hitQueue.shift(); // Remove the oldest hit
    }
    this.hitQueue.push(hit);
    this.processHits();
  }

  // Puts the Queue in non-suspended state and begin processing hits
  public beginProcessing(): void {
    this.isSuspended = false;
    this.processHits();
  }

  // Puts the Queue in suspended state and discontinue processing hits
  public suspend(): void {
    this.isSuspended = true;
  }

  // Removes all the persisted hits from the queue
  public clear(): void {
    this.hitQueue = [];
  }

  // Returns the number of items in the queue
  public count(): number {
    return this.hitQueue.length;
  }

  // Close the current HitQueuing
  public close(): void {
    this.clear();
    this.isSuspended = false;
    this.isProcessing = false;
  }

  // Processes the hits in the queue
  private async processHits(): Promise<void> {
    if (this.isProcessing || this.isSuspended) {
      return;
    }
    while (!this.isSuspended && this.hitQueue.length > 0) {
      const hit = this.hitQueue.shift();
      if (!hit) {
        continue;
      }
      this.isProcessing = true;
      await retry<boolean>()
        //TODO: need to add more retry strategies, such as exponential backoff.
        .waitAndRetry(-1, this.retryIntervalMs)
        .retryOnResult((res) => res === false)
        .execute(() => {
          const result = this.hitProcessing.processHit(hit);
          console.log("Hit is processed with result:", result);
          return result;
        });
    }
    this.isProcessing = false;
  }
}
