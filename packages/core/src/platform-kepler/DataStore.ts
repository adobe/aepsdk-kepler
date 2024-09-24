import { DataStore } from "../core/services";

export class KeplerDataStore implements DataStore {
  private data: Map<string, any> = new Map();

  loadData(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // TODO: call Kepler API to load data
      resolve(this.data.get(key));
    });
  }

  saveData(key: string, data: any): void {
    // TODO: call Kepler API to write data
    this.data.set(key, data);
  }
}
