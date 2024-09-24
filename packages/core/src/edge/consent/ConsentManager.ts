import { Event, EventType, EventSource } from "../../core/eventhub";

type DispatchFn = (event: Event) => void;

export enum ConsentValue {
    YES = 'y',
    NO = 'n',
    PENDING = 'p'
}

export class ConsentManager {
    private dispatchFn: DispatchFn;
    private collectConsent: ConsentValue = ConsentValue.YES;
    private defaultConsent: Map<string, ConsentValue> | null = null;

    constructor(dispatchFn: DispatchFn) {
        this.dispatchFn = dispatchFn;
    }

    processConfigurationEvent(event: Event) {
        // TODO: read default consent from the configuration if available
    }

    handleConsentEvent(event : Event) {
        // TODO: handle the setConset event
        // Create the payload for the consent request
        // This might be included in the edge extension as it that is responsible for sending the request
    }

    processEdgeResponseEvent(event: Event) {
        // TODO: process the response from the edge
        // Extract the consent value from the response
        // update the collectConsent value
    }

    getCollectConsent(): ConsentValue {
        return this.collectConsent;
    }

    setCollectConsent(consent: ConsentValue) {
        this.collectConsent = consent;
    }

    dispatchConsentSharedState() {
        // TODO: dispatch the consent shared state
    }
}
