import { EventListener, Event } from "../eventhub";
import { SharedStateResult } from "../sharedstate";

export type DispatchFn = (event: Event) => void;

export interface ExtensionContainer {
  registerEventListener(eventType: string, eventSource: string, listener: EventListener): string;

  createXDMSharedState(state: Map<string, any>, event: Event | null): void;
  // TODO: remove XDM from the name since we only support Edge only solutions in Kepler

  createPendingXDMSharedState(event: Event | null): Promise<SharedStateResolver>;

  getXDMSharedState(extensionName: string, event: Event | null): SharedStateResult | null;

  dispatch(event: Event): void;
}

export type SharedStateResolver = (state: Map<string, any> | null) => void;
