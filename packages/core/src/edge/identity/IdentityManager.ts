import { Event, EventType, EventSource } from "../../core/eventhub";
import { DispatchFn } from "../../core/extension";

export class IdentityManager {
    private dispatchFn: DispatchFn;
    private ecid: string | null = null;

    constructor(dispatchFn: DispatchFn) {
        this.dispatchFn = dispatchFn;
    }

    processEdgeResponseEvent(event: Event) {
        // TODO: process the response from the edge
        // Extract the ECID from the response
        // update the ecid value
    }

    getECID(): string | null {
        return this.ecid;
    }

    setECID(ecid: string) {
    }

    getIdentityMap(): Map<string, string> | null {
        // TODO: generate the identity map with the ECID
        return null;
    }

    dispatchIdentitySharedState() {
    }
}
