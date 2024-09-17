import { registerService } from '../core/services';
import { KeplerDataStore } from './DataStore';

export function registerPlatformService(): void {
    registerService('dataStore', new KeplerDataStore());
}