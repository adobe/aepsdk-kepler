import { defaultDataStore, DataStore } from "./DataStore";

export interface Services {
    'dataStore': DataStore;
}
export type Name = keyof Services;
// export type Service = Services[Name];

const services: Services = {
    dataStore: defaultDataStore,
}

export interface ServiceLookup {
    getService<T extends Name>(name: T): Services[T];
}

export const serviceLookup: ServiceLookup = {
    // We may add more APIs in the future for multiple SDK Contianer support, such as generating new service instances per container
    getService<T extends Name>(name: T): Services[T] {
        return services[name];
    }
}

// TODO: add a log service later
export type {
    DataStore,
}

export function registerService<T extends Name>(name: T, service: Services[T]) {
    services[name] = service;
}