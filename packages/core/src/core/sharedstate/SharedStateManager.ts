import type { SharedStateStatus, SharedStateResult } from '.'

export class SharedStateManager {
    constructor() { }

    private sharedStateMap: Map<string, Map<number, SharedStateResult>> = new Map();

    public updateSharedState(extensionName: string, version: number, state: Map<string, any>, status: SharedStateStatus): void {
        if (!this.sharedStateMap.has(extensionName)) {
            this.sharedStateMap.set(extensionName, new Map());
        }
        this.sharedStateMap.get(extensionName)?.set(version, {
            status: status,
            value: state
        });
    }

    public getSharedState(extensionName: string, version: number): SharedStateResult | null {
        return this.resolve(this.sharedStateMap.get(extensionName), version);
    }

    public removeSharedState(extensionName: string, version: number): void {
        this.sharedStateMap.get(extensionName)?.delete(version);
    }

    private resolve(sharedStates: Map<number, SharedStateResult> | null | undefined, version: number): SharedStateResult | null {
        if (!sharedStates) {
            return null;
        }
        for (var i = version; i >= 0; i--) {
            var sharedStateResult = sharedStates.get(i);
            if (sharedStateResult) {
                return sharedStateResult;
            }
        }
        // not found the shared state that version is less than or equal to the given version
        if (sharedStates.size > 0) {
            return sharedStates.values().next().value || null;
        }
        return null;
    }

}