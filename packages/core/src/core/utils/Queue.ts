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

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/**
 * Wrap a function in a Promise.resolve().then() block to run it asynchronously.
 *
 * @param fn the function to run asynchronously
 */

/**
 * A simple queue implementation.
 */
export class Queue<T> {
  private items: T[] = [];

  /**
   * Adds an item to the end of the queue.
   * @param item The item to add to the queue.
   */
  enqueue(item: T): void {
    this.items.push(item);
  }

  /**
   * Removes and returns the item at the front of the queue.
   * @returns The item at the front of the queue, or undefined if the queue is empty.
   */
  dequeue(): T | undefined {
    return this.items.shift();
  }

  /**
   * Returns the item at the front of the queue without removing it.
   * @returns The item at the front of the queue, or undefined if the queue is empty.
   */
  peek(): T | undefined {
    return this.items[0];
  }

  /**
   * Returns true if the queue is empty.
   * @returns True if the queue is empty, false otherwise.
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Returns the number of items in the queue.
   * @returns The number of items in the queue.
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Removes all items from the queue.
   */
  clear(): void {
    this.items = [];
  }
}
