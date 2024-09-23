import { SharedStateManager } from "./core/sharedstate/SharedStateManager";
import { Extension, ExtensionContainerImpl } from "./core/extension";
import { EventhubImpl } from "./core/eventhub/EventhubImpl";
import { EventProcessor, Event } from "./core/eventhub";
import { serviceLookup } from "./core/services";
import { Log } from "./core/utils/Log";
import { configuration } from "./configuration";
import { edge } from "./edge/Edge";
import { registerPlatformService } from "./platform-kepler";

export interface SDKParams {
  // TODO: we will enable this in the future for registering other optional extensions, such as Media, AJO, etc.
  // extensions?: Array<Extension>;
  config?: Record<string, any>;
  // The tennant paramater will be enabled in the future for the contianerlization support.
  // tenants?: Array<string>;
}

export const AEPSDK = {
  version: "1.0.0",

  start(prams?: SDKParams): void {
    registerPlatformService();

    var eventHub = new EventhubImpl();
    var sharedStateManager = new SharedStateManager();
    var processor: EventProcessor = (event: Event) => {
      // add rules evaluation here
      return event;
    };
    eventHub.registerEventProcessor(processor);

    configuration.onRegister(
      new ExtensionContainerImpl(eventHub, configuration.name, sharedStateManager),
      serviceLookup
    );
    edge.onRegister(
      new ExtensionContainerImpl(eventHub, edge.name, sharedStateManager),
      serviceLookup
    );

    // TODO: enalbe this in the future for registering other optional extensions.
    // prams?.extenions?.forEach(extenion => {
    //     extension.onRegister(new ExtensionContainerImpl(eventHub, extension.name, sharedStateManager), serviceLookup);
    //     Log.debug("Extension registered: " + extension.name);
    // });

    eventHub.start();
    let config = prams?.config;
    if (config) {
      // NOTE: this is an example of how to call extension APIs
      // getConfiguration("non_default_tennant").updateConfiguration(config);
      configuration.updateConfiguration(config);
    }
  },

  updateConfiguration(configuration: Record<string, any>): void {
    configuration.updateConfiguration(configuration);
  },
};

export { edge };
