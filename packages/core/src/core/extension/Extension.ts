import type { ExtensionContainer } from './ExtensionContainer';
import { ServiceLookup } from '../services';

export interface Extension {
    version: string;
    name: string;
    onRegister(extensionContainer: ExtensionContainer, serviceLookup: ServiceLookup): void;
    onUnregister(): void; // It's not used in the codebase
}