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

import { HttpMethod } from "./";

/**
 * NetworkRequest is a data structure that represents a network request. It is used to send a request to the network.
 *
 * @param url the URL of the request
 * @param method the HTTP method of the request
 * @param headers the headers of the request
 * @param body the body of the request
 * @param timeout the connection timeout of the request in milliseconds
 */
export interface NetworkRequest {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: BodyType;
  readonly timeout: number;
}

export type BodyType = string | null;
// We can enable below types when we have a use case for them.
// | Blob
// | Iterable<Uint8Array>
// | ArrayBuffer
