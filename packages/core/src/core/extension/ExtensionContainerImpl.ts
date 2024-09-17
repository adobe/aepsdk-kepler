import { ExtensionContainer, SharedStateResolver } from ".";
import { EventHub, EventListener, Event, buildSharedStateEvent, buildPendingSharedStateEvent } from "../eventhub";
import { SharedStateStatus, SharedStateResult, SharedStateManager } from "../sharedstate";

export class ExtensionContainerImpl implements ExtensionContainer {
    constructor(private eventHub: EventHub, private extensionName: string, private sharedStateManager: SharedStateManager) { }

    registerEventListener(eventType: string, EventSource: string, listener: EventListener): string {
        return this.eventHub.on(eventType, EventSource, listener);
    }

    createXDMSharedState(state: Map<string, any>, event: Event | null): void {
        let version = event ? event.id : 0;
        this.sharedStateManager.updateSharedState(this.extensionName, version, state, SharedStateStatus.SET);
        let sharedStateEvent = buildSharedStateEvent(this.extensionName, state)
        this.eventHub.dispatchEvent(sharedStateEvent);
    }

    createPendingXDMSharedState(event: Event | null): Promise<SharedStateResolver> {
        let version = event ? event.id : 0;
        this.sharedStateManager.updateSharedState(this.extensionName, version, new Map(), SharedStateStatus.PENDING);
        let sharedStateEvent = buildPendingSharedStateEvent(this.extensionName, new Map())
        this.eventHub.dispatchEvent(sharedStateEvent);
        return new Promise((resolve, reject) => {
            resolve((state: Map<string, any> | null) => {
                if (state) {
                    this.sharedStateManager.updateSharedState(this.extensionName, version, state, SharedStateStatus.SET);
                    let sharedStateEvent = buildSharedStateEvent(this.extensionName, state)
                    this.eventHub.dispatchEvent(sharedStateEvent);
                } else {
                    this.sharedStateManager.removeSharedState(this.extensionName, version);
                    let sharedStateEvent = buildSharedStateEvent(this.extensionName, new Map())
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