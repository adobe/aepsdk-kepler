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
import { ExtensionContainer } from "./ExtensionContainer";
import { ExtensionContainerImpl } from "./ExtensionContainerImpl";
import { EventHub } from "../eventhub";
import { SharedStateManager } from "../sharedstate";

export type { Extension } from "./Extension";
export { isExtension } from "./Extension";
export type { ExtensionContainer, SharedStateResolver } from "./ExtensionContainer";

export function createExtensionContainer(
  eventHub: EventHub,
  extensionName: string,
  sharedStateManager: SharedStateManager
): ExtensionContainer {
  return new ExtensionContainerImpl(eventHub, extensionName, sharedStateManager);
}
