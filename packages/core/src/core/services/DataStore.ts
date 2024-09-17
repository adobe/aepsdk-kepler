// TODO: The implementation code requires the use of platform specific APIs, such as Keper's async storage API. 
// Considering to move the implementation code to the platform specific package ???
export interface DataStore {
    loadDate(key: string): Promise<any>;
    saveData(key: string, data: any): void;
}

class DefaultDataStore implements DataStore {
    private data: Map<string, any> = new Map();

    loadDate(key: string): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(this.data.get(key));
        });
    }

    saveData(key: string, data: any): void {
        this.data.set(key, data);
    }
}

export const defaultDataStore: DataStore = new DefaultDataStore();