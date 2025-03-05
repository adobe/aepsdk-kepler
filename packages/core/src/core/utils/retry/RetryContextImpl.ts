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
import { RETRY_CONSTANTS } from "./Constants";
import { EXTENSION_NAME as LOG_EXTENSION } from "../Constants";
import { Log } from "../Log";
import { buildNextInterval } from "./Interval";
import { Executor, RetryContext } from ".";

const LOG_TAG = "RetryContextImpl";

export class RetryContextImpl<T> implements RetryContext<T> {
  private retryOnResultFn: ((result: T) => boolean) | null = null;
  private retryOnErrorFn: ((error: Error) => boolean) | null = null;
  private nextInterval: () => number = () => -1;
  private executor: Executor<T> | null = null;

  waitAndRetry(
    maxRetries: number,
    intervalMs: number = RETRY_CONSTANTS.DEFAULT_RETRY_INTERVAL_IN_MS
  ): RetryContext<T> {
    this.nextInterval = buildNextInterval(maxRetries, intervalMs);
    return this;
  }

  retryOnResult(fn: (result: T) => boolean): RetryContext<T> {
    this.retryOnResultFn = fn;
    return this;
  }

  retryOnError(fn: (error: Error) => boolean): RetryContext<T> {
    this.retryOnErrorFn = fn;
    return this;
  }

  async execute(executor: Executor<T>): Promise<T> {
    this.executor = executor;
    return this.innerRetry();
  }

  private async innerRetry(): Promise<T> {
    if (!this.executor) {
      return Promise.reject(new Error("Executor is not set"));
    }

    const interval = this.nextInterval();

    try {
      const result = await this.executor();
      if (this.retryOnResultFn && this.retryOnResultFn(result)) {
        if (interval > 0) {
          return new Promise<T>((resolve, reject) => {
            setTimeout(() => {
              this.innerRetry().then(resolve, reject);
            }, interval);
          });
        }
      }
      return result;
    } catch (error) {
      Log.debug(LOG_EXTENSION, LOG_TAG, `Retry error: ${(error as Error).message}`);
      if (interval > 0) {
        if (this.retryOnErrorFn && !this.retryOnErrorFn(error as Error)) {
          return Promise.reject(error);
        }
        return new Promise<T>((resolve, reject) => {
          setTimeout(() => {
            this.innerRetry().then(resolve, reject);
          }, interval);
        });
      }
      return Promise.reject(error);
    }
  }
}
