import { Extension } from "../core/extension";
import { ConfigurationImpl } from "./ConfigurationImpl";

// Interface
export interface Configuration extends Extension {
  updateConfiguration(configuration: Record<string, any>): void;
}

export const configuration: Configuration = new ConfigurationImpl();
