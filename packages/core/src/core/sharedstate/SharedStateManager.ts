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
import type { SharedStateStatus, SharedStateResult } from ".";

/* eslint-disable @typescript-eslint/no-explicit-any */
export class SharedStateManager {
  constructor() {}

  private sharedStateMap: Map<string, Map<number, SharedStateResult>> = new Map();

  /**
   * Update the shared state of the given extension.
   *
   * @param extensionName The name of the extension
   * @param version The version of the shared state to be created
   * @param state The content that the shared state needs to be populated with
   * @param status The status of the shared state
   */
  public updateSharedState(
    extensionName: string,
    version: number,
    state: Map<string, any> | null,
    status: SharedStateStatus
  ): void {
    if (!this.sharedStateMap.has(extensionName)) {
      this.sharedStateMap.set(extensionName, new Map());
    }
    this.sharedStateMap.get(extensionName)?.set(version, {
      status: status,
      value: state,
    });
  }

  /**
   * Get the shared state of the given extension. If the shared state of the given version does not exist, return the next valid shared state.
   *
   * @param extensionName The name of the extension
   * @param version The version of the shared state to be retrieved
   * @returns The content of the shared state
   */
  public getSharedState(extensionName: string, version: number): SharedStateResult | null {
    return this.resolve(this.sharedStateMap.get(extensionName), version);
  }

  /**
   * Remove the shared state of the given extension.
   *
   * @param extensionName The name of the extension
   * @param version The version of the shared state to be created
   */
  public removeSharedState(extensionName: string, version: number): void {
    this.sharedStateMap.get(extensionName)?.delete(version);
  }

  private resolve(
    sharedStates: Map<number, SharedStateResult> | null | undefined,
    version: number
  ): SharedStateResult | null {
    if (!sharedStates) {
      return null;
    }
    for (let i = version; i >= 0; i--) {
      const sharedStateResult = sharedStates.get(i);
      if (sharedStateResult && sharedStateResult.value) {
        return sharedStateResult;
      }
    }
    // Not found the shared state that is less than or equal to the given version
    // Return the next valid shared state
    for (const sharedStateResult of sharedStates.values()) {
      if (sharedStateResult.value) {
        return sharedStateResult;
      }
    }

    // If there is no valid (SET) shared state, return the last one or null
    if (sharedStates.size > 0) {
      return Array.from(sharedStates)[sharedStates.size - 1][1];
    }
    return null;
  }
}
