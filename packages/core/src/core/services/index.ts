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
import { defaultDataStore, DataStore } from "./DataStore";
import { defaultLogging, LogLevel, Logging } from "./Logging";

export interface Services {
  dataStore: DataStore;
  logging: Logging;
}
export type Name = keyof Services;

const services: Services = {
  dataStore: defaultDataStore,
  logging: defaultLogging,
};

export interface ServiceLookup {
  getService<T extends Name>(name: T): Services[T];
}

export const serviceLookup: ServiceLookup = {
  // We may add more APIs in the future for multiple SDK Contianer support, such as generating new service instances per container
  getService<T extends Name>(name: T): Services[T] {
    return services[name];
  },
};

export type { DataStore };

export { LogLevel, type Logging };

export function registerService<T extends Name>(name: T, service: Services[T]) {
  services[name] = service;
}
