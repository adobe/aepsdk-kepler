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
import type { ExtensionContainer } from "./ExtensionContainer";
import { ServiceLookup } from "../services";

export interface Extension {
  version: string;
  name: string;
  /**
   * Called when the extension is registered.
   *
   * @param extensionContainer The container for this extension
   * @param serviceLookup The function to retrieve services
   */
  onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): void;
}

export function isExtension(extension: any): extension is Extension {
  return extension && extension.name && extension.version && typeof extension.onRegister === 'function';
}