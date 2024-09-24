import { Edge } from ".";
import { Event, EventType, EventSource } from "../core/eventhub";
import { Extension, ExtensionContainer, DispatchFn } from "../core/extension";
import { DataStore, ServiceLookup } from "../core/services";
import { ConsentManager } from "./consent/ConsentManager";
import { IdentityManager } from "./identity/IdentityManager";

// Implementation
export class EdgeImpl implements Edge {
    private isActive: boolean = false;
    private container: ExtensionContainer | null = null;
    private serviceLookup: ServiceLookup | null = null;
    private dataStoreService: DataStore | null = null;
    private consentManager: ConsentManager | null = null;
    private identityManager: IdentityManager | null = null;
    private dispatchFn: DispatchFn | null = null;

    public version: string = "1.0.0";
    public name: string = "com.adobe.mobile.marketing.edge";

    onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): void {
        this.container = extensionContainer;
        this.serviceLookup = serviceLookup;
        this.dataStoreService = serviceLookup.getService('dataStore');
        this.dispatchFn = this.container.dispatch;
        this.consentManager = new ConsentManager(this.dispatchFn);
        this.identityManager = new IdentityManager(this.dispatchFn);
        this.isActive = true;
        this._registerListeners();
    }

    sendEvent(xdm: Map<string, object>, data: Map<string, object>): void {

    }

    _registerListeners(): void {
        // if the container is not available, then return
        if (this.container === null) {
            // log error message
            return;
        }

        this.container.registerEventListener(EventType.EDGE, EventSource.REQUEST_CONTENT, (event) => {
            if (this.isActive) {
                //TODO: implement the logic here
            }
        });
    }

    onUnregister(): void {
        this.isActive = false;
        this.container = null;
        this.serviceLookup = null;
    }
}
