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
import { DataStore, Log } from '@adobe/js-aepcore';
import { LOG_EXTENSION } from "./Constants";

const KEY_PREFIX = "adb_aep_";

const LOG_TAG = "BrowserDataStore";

//TODO: we may change this to use local storage instead of session storage
export class SessionDataStore implements DataStore {
  private getKeyWithPrefix(key: string): string {
    return KEY_PREFIX + key;
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.getKeyWithPrefix(key);
    Log.debug(
      LOG_EXTENSION,
      LOG_TAG,
      `get() - Retrieving value for key(${prefixedKey}) from KeplerDataStore`
    );

    try {
      const value = sessionStorage.getItem(prefixedKey);
      return value != null ? value : null;
    } catch (error) {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `get() - Failed to retrieve value for key(${prefixedKey}), error(${(error as Error).message
        })`
      );
      return null;
    }
  }

  set(key: string, value: string): void {
    const prefixedKey = this.getKeyWithPrefix(key);
    Log.debug(
      LOG_EXTENSION,
      LOG_TAG,
      `set() - Saving Key(${prefixedKey}) with value(${value}) to KeplerDataStore`
    );
    try {
      sessionStorage.setItem("key", "value");

    } catch (error) {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `set() - Failed to save key(${prefixedKey}) with value(${value}), error: ${(error as Error).message
        }`
      );
    }
  }

  delete(key: string): void {
    const prefixedKey = this.getKeyWithPrefix(key);
    Log.debug(
      LOG_EXTENSION,
      LOG_TAG,
      `delete() - Deleting key(${prefixedKey}) from KeplerDataStore`
    );
    try {
      sessionStorage.removeItem(prefixedKey);
    } catch (error) {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `delete() - Failed to delete key(${prefixedKey}), error(${(error as Error).message})`
      );
    }
  }
}
