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
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Log } from "../Log";
import { NetworkRequest, HttpConnection } from "./";
import { DEFAULT_HEADER, DEFAULT_TIMEOUT, ERROR_CONNECTION } from "./Constants";
import { stringify } from "../Common";

const LOG_TAG = "Networking";
const LOG_EXTENSION = "Utils";

/**
 * Initiates an asynchronous network connection
 */
export async function asyncRequest(request: NetworkRequest): Promise<HttpConnection> {
  if (!request.url.toLowerCase().startsWith("https://")) {
    Log.error(
      LOG_EXTENSION,
      LOG_TAG,
      `Invalid URL ${request.url}, only HTTPS protocol is supported`
    );
    return ERROR_CONNECTION;
  }

  Log.debug(
    LOG_EXTENSION,
    LOG_TAG,
    `Send request to ${request.url}, body: ${stringify(request.body)}`
  );

  const mergedHeader: Record<string, string> = request.headers
    ? { ...DEFAULT_HEADER, ...request.headers }
    : DEFAULT_HEADER;

  Log.debug(LOG_EXTENSION, LOG_TAG, `Merged headers: ${stringify(mergedHeader)}`);

  const { abortController, clearAbortTimer } = buildAbortSignal(
    request.timeout > 0 ? request.timeout : DEFAULT_TIMEOUT
  );

  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: mergedHeader,
      body: request.body,
      signal: abortController.signal,
    });

    Log.debug(LOG_EXTENSION, LOG_TAG, `Response code is: ${response.status}`);

    const headers: Record<string, string> = {};
    for (const [name, value] of response.headers) {
      headers[name] = value;
    }

    Log.debug(LOG_EXTENSION, LOG_TAG, "Start to parse response body as text.");
    const text = await response.text();

    return {
      responseCode: response.status,
      headers: headers,
      bodyAsText: text,
    };
  } catch (error) {
    Log.error(LOG_EXTENSION, LOG_TAG, `Failed to send request: ${(error as Error).message}`);
    return ERROR_CONNECTION;
  } finally {
    clearAbortTimer();
  }
}

function buildAbortSignal(timeout: number): {
  abortController: AbortController;
  clearAbortTimer: () => void;
} {
  // "AbortController" was included in React Native 0.60 https://github.com/react-native-community/releases/blob/master/CHANGELOG.md#added-10
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), timeout);
  const clearAbortTimer = () => clearTimeout(timer);
  return { abortController, clearAbortTimer };
}
