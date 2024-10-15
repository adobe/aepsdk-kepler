import { Extension } from "../core/extension";
import { EdgeImpl } from "./EdgeImpl";

// Interface
export interface Edge extends Extension {
  // public APIs
  // sendEvent(xdm: Map<string, object>, data: Map<string, object>): void;
  // sendEventWithPromise(xdm: Map<string, object>, data: Map<string, object>): Promise<any>;
  // getECID(): string | null;
  //setConsent(consent: Map<string, object>): void;
}

export const edge: Edge = new EdgeImpl();
