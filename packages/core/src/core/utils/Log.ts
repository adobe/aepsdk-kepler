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

import { serviceLookup } from "../services";

export const Log = {
  /**
   * Information provided to the debug method should contain high-level details about the data
   * being processed. Prints information to the console only when the SDK is in VERBOSE, and DEBUG mode.
   *
   * @param extension The extension name
   * @param tag The source of the information to be logged
   * @param message The string to be logged
   */
  debug: (extension: string, tag: string, message: string) => {
    serviceLookup.getService("logging").debug(`${extension}-${tag}`, message);
  },

  /**
   * Information provided to the warning method indicates that a request has been made to the SDK,
   * but the SDK will be unable to perform the requested task. An example is catching an expected
   * or unexpected but recoverable exception. Prints information to the console only when the SDK
   * is in VERBOSE, DEBUG, and WARNING mode.
   *
   * @param extension The extension name
   * @param tag The source of the information to be logged
   * @param message The string to be logged
   */
  warning: (extension: string, tag: string, message: string) => {
    serviceLookup.getService("logging").warning(`${extension}-${tag}`, message);
  },

  /**
   * Information provided to the error method indicates that there has been an unrecoverable
   * error. Prints information to the console regardless of current Loglevel of the SDK.
   *
   * @param extension The extension name
   * @param tag The source of the information to be logged
   * @param message The string to be logged
   */
  error: (extension: string, tag: string, message: string) => {
    serviceLookup.getService("logging").error(`${extension}-${tag}`, message);
  },

  /**
   * Used to print more verbose information. Info logging is expected to follow end-to-end every
   * method an event hits. Prints information to the console only when the SDK is in VERBOSE mode.
   *
   * @param extension The extension name
   * @param tag The source of the information to be logged
   * @param message The string to be logged
   */
  verbose: (extension: string, tag: string, message: string) => {
    serviceLookup.getService("logging").verbose(`${extension}-${tag}`, message);
  },
};
