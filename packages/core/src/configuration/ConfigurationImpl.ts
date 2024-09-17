import { Configuration } from ".";
import { Event, EventType, EventSource } from "../core/eventhub";
import { ExtensionContainer } from "../core/extension";
// Constants
const UPDTE_CONFIGURATION = "config.update";
// Implementation
export class ConfigurationImpl implements Configuration {
    private container: ExtensionContainer | null = null;
    private isActive: boolean = false;

    public version: string = "1.0.0";
    public name: string = "com.adobe.mobile.marketing.configuration";

    private currentConfiguration: Map<string, any> = new Map();

    updateConfiguration(configuration: Record<string, any>): void {
        if (this.container === null) {
            // TODO: print log message
            return
        }
        var data = new Map<string, any>();
        data.set(UPDTE_CONFIGURATION, configuration);
        this.container.dispatch(new Event(EventType.CONFIGURATION, EventSource.REQUEST_CONTENT, data));
    }

    onRegister(extensionContainer: ExtensionContainer): void {
        this.container = extensionContainer;
        this.isActive = true;
        this.container.registerEventListener(EventType.CONFIGURATION, EventSource.REQUEST_CONTENT, (event) => {
            if (this.isActive) {
                var configuration = event.data?.get(UPDTE_CONFIGURATION);
                if (!configuration) {
                    // TODO: print log message
                    return;
                }
                //TODO: Need to check the type of configuration
                for (const key in configuration) {
                    this.currentConfiguration.set(key, configuration[key]);
                }
                this.container?.createXDMSharedState(this.currentConfiguration, event);
            } else {
                //TODO: print log message
                throw new Error('Configuration Extension is not registered');
            }
        });
    }

    onUnregister(): void {
        this.isActive = false;
        this.container = null;
        // remove all listeners and clear shared states
    }
}