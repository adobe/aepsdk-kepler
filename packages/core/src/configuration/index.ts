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
import { ConfigurationExtension } from "./ConfigurationExtension";
import { Extension } from "../core/extension";

export interface Configuration {
  /**
   * Update the SDK configuration
   *
   * @param configuration Configuration key/value pairs to be updated or added.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConfiguration(configuration: Record<string, any>): void;

  readonly EXTENSION: Extension;
}

export const configuration: Configuration = new ConfigurationExtension();
