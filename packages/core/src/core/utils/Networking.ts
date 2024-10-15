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

import { Log } from "./Log";

export const version = "1.0.0";

const defulatHeader = {
  "Content-Type": "application/json",
  accept: "application/json",
  "Accept-Language": "en-US",
};

export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
}

export interface NetworkRequest {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly connectTimeout: number;
  readonly readTimeout: number;
}

export interface HttpConnection {
  readonly responseCode: number;
  readonly headers?: Record<string, string>;
  readonly body?: any;
  // TODO: getResponsePropertyValue() "last-modified", or "ETag"
}

export function asyncRequest(request: NetworkRequest): Promise<HttpConnection> {
  const mergedHeader = request.headers ? { ...defulatHeader, ...request.headers } : defulatHeader;
  return new Promise((resolve, reject) => {
    // send request through fetch
    Log.debug(`[Networking] Sending request to ${request.url}, boyd: ${request.body}`);
    fetch(request.url, {
      method: request.method,
      headers: mergedHeader,
      body: request.body,
    })
      .then((response) => {
        if (!response.ok) {
          Log.error(`Request failed with error ${response.status}`);
          reject(new Error(`Request failed with error ${response.status}`));
          return;
        }
        return response.json();
      })
      .then((data) => {
        // console.log(data);
        resolve({
          responseCode: 200,
          headers: {},
          body: data as any,
        });
      })
      .catch((error) => {
        reject(new Error(`Request failed with error ${error}`));
      });
  });
}
