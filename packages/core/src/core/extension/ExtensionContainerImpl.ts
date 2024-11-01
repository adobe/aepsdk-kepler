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
import { ExtensionContainer, SharedStateResolver } from ".";
import { EventHub, EventListener, Event, EventData } from "../eventhub";
import { buildSharedStateEvent } from "../sharedstate";
import { SharedStateStatus, SharedStateResult, SharedStateManager } from "../sharedstate";

export class ExtensionContainerImpl implements ExtensionContainer {
  constructor(
    private eventHub: EventHub,
    private extensionName: string,
    private sharedStateManager: SharedStateManager
  ) { }

  registerEventListener(eventType: string, EventSource: string, listener: EventListener): void {
    this.eventHub.on(eventType, EventSource, listener);
  }

  createXDMSharedState(state: EventData, event: Event | null): void {
    const version = event ? event.id : 0;
    this.sharedStateManager.updateSharedState(
      this.extensionName,
      version,
      state,
      SharedStateStatus.SET
    );
    const sharedStateEvent = buildSharedStateEvent(this.extensionName);
    this.eventHub.dispatchEvent(sharedStateEvent);
  }

  createPendingXDMSharedState(event: Event | null): Promise<SharedStateResolver> {
    const version = event ? event.id : 0;
    this.sharedStateManager.updateSharedState(
      this.extensionName,
      version,
      null,
      SharedStateStatus.PENDING
    );

    return new Promise((resolve) => {
      resolve((state: EventData | null) => {
        if (state) {
          this.sharedStateManager.updateSharedState(
            this.extensionName,
            version,
            state,
            SharedStateStatus.SET
          );
          const sharedStateEvent = buildSharedStateEvent(this.extensionName);
          this.eventHub.dispatchEvent(sharedStateEvent);
        } else {
          this.sharedStateManager.removeSharedState(this.extensionName, version);
          const sharedStateEvent = buildSharedStateEvent(this.extensionName);
          this.eventHub.dispatchEvent(sharedStateEvent);
        }
      });
    });
  }

  getXDMSharedState(extensionName: string, event: Event | null): SharedStateResult | null {
    return this.sharedStateManager.getSharedState(extensionName, event ? event.id : 0);
  }

  dispatch(event: Event): void {
    this.eventHub.dispatchEvent(event);
  }
}
