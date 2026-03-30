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

export interface HitQueuing<T> {
  /**
   * Queues an EdgeHit to be processed
   *
   * @param hit the hit to be processed
   */
  queue(hit: T): void;

  /** Puts the Queue in non-suspended state and begin processing hits */
  beginProcessing(): void;

  /** Puts the Queue in suspended state and discontinue processing hits */
  suspend(): void;

  /** Removes all the persisted hits from the queue */
  clear(): void;

  /** Returns the number of items in the queue */
  count(): number;

  /** Close the current HitQueuing */
  close(): void;
}
