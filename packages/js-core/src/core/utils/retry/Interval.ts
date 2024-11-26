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

/**
 *
 * @param maxRetries the maximum number of retries
 * @param intervalMs the retry interval in milliseconds
 * @returns a function to compute next interval for retry
 */
export function buildNextInterval(maxRetries: number, intervalMs: number): () => number {
  let maxRetriesCount = maxRetries;
  const interval = intervalMs;
  return () => {
    if (maxRetriesCount > 0) {
      maxRetriesCount--;
      return interval;
    }
    return -1;
  };
}

//TODO
// function buildNextIntervalForExponentialRetry(maxRetries: number, maxInternal: number): () => number {}
