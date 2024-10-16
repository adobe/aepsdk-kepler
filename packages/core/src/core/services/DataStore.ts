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

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface DataStore {
  loadData(key: string): Promise<any>;
  saveData(key: string, data: any): void;
}

// In-memory data store implementation
class DefaultDataStore implements DataStore {
  private data: Map<string, any> = new Map();

  loadData(key: string): Promise<any> {
    return new Promise((resolve) => {
      resolve(this.data.get(key));
    });
  }

  saveData(key: string, data: any): void {
    this.data.set(key, data);
  }
}

export const defaultDataStore: DataStore = new DefaultDataStore();
