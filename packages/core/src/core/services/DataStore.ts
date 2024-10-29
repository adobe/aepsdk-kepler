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

import { Log } from "../utils/Log";
import { LOG_EXTENSION } from "./Constants";

const LOG_TAG = "DefaultDataStore";

export interface DataStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): void;
  delete(key: string): void;
}

// In-memory data store implementation
class DefaultDataStore implements DataStore {
  private data: Map<string, string> = new Map();

  get(key: string): Promise<string | null> {
    Log.debug(LOG_EXTENSION, LOG_TAG, `Retrieve value for key: ${key}`);

    const value = this.data.get(key);
    return new Promise((resolve) => {
      resolve(value ? value : null);
    });
  }

  set(key: string, value: string): void {
    Log.debug(LOG_EXTENSION, LOG_TAG, `Save data to a Map (key = ${key}, value = ${value})`);
    this.data.set(key, value);
  }

  delete(key: string): void {
    this.data.delete(key);
  }
}

export const defaultDataStore: DataStore = new DefaultDataStore();
