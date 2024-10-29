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
import { RetryContextImpl } from "./RetryContextImpl";

/**
 * A function that returns a promise
 */
export type Executor<T> = () => Promise<T>;

/**
 * Create a new RetryContext
 *
 * @returns a new RetryContext
 */
export function retry<T>(): RetryContext<T> {
  return new RetryContextImpl();
}

export interface RetryContext<T> {
  /**
   *
   * @param maxRetries the maximum number of retries
   * @param intervalMs the retry interval in milliseconds
   */
  waitAndRetry(maxRetries: number, intervalMs: number): RetryContext<T>;

  /**
   *
   * @param maxRetries the maximum number of retries
   */
  waitAndRetry(maxRetries: number): RetryContext<T>;

  /**
   *
   * @param fn a function that returns true if the result should be retried
   */
  retryOnResult(fn: (result: T) => boolean): RetryContext<T>;

  /**
   *
   * @param fn a function that returns true if the error should be retried
   */
  retryOnError(fn: (error: Error) => boolean): RetryContext<T>;

  /**
   * Execute the Executor function multiple times if needed.
   *
   * @param executor a function that returns a promise
   */
  execute(executor: Executor<T>): Promise<T>;
}
