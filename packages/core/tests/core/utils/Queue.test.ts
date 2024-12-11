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
import { Queue } from "../../../src/core/utils/Queue";
describe("test Queue class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("test enqueue()", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    expect(queue.size()).toBe(2);
    expect(queue.peek()).toBe(1);
  });

  test("test dequeue()", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    const item = queue.dequeue();
    expect(item).toBe(1);
    expect(queue.size()).toBe(1);
    expect(queue.peek()).toBe(2);
  });

  test("test peek()", () => {
    const queue = new Queue<number>();
    queue.enqueue(1);
    queue.enqueue(2);
    const item = queue.peek();
    expect(item).toBe(1);
    expect(queue.size()).toBe(2);
  });

  test("test isEmpty()", () => {
    const queue = new Queue<number>();
    expect(queue.isEmpty()).toBe(true);
    queue.enqueue(1);
    expect(queue.isEmpty()).toBe(false);
  });

  test("test size()", () => {
    const queue = new Queue<number>();
    expect(queue.size()).toBe(0);
    queue.enqueue(1);
    queue.enqueue(2);
    expect(queue.size()).toBe(2);
  });
});
