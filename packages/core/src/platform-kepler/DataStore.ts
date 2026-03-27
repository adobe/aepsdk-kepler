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
import { DataStore } from "../core/services";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Log } from "../core/utils/Log";
import { LOG_EXTENSION } from "./Constants";

//  https://developer.amazon.com/docs/kepler-tv-rn/0.72/asyncstorage.html
//  https://developer.amazon.com/docs/kepler-tv-api/react-native-async-storage.html
//  Amazon will deprecate the AsyncStorage API in a future release. Kepler version 0.8 introduces the react-native-async-storage library.
//  Use the react-native-async-storage library for any apps built with Kepler version 0.8 or later.

const KEY_PREFIX = "adb_aep_";

const LOG_TAG = "VegaDataStore";

export class VegaDataStore implements DataStore {
  private getKeyWithPrefix(key: string): string {
    return KEY_PREFIX + key;
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = this.getKeyWithPrefix(key);
    Log.debug(
      LOG_EXTENSION,
      LOG_TAG,
      `get() - Retrieving value for key(${prefixedKey}) from VegaDataStore`
    );

    try {
      const value = await AsyncStorage.getItem(prefixedKey);
      return value != null ? value : null;
    } catch (error) {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `get() - Failed to retrieve value for key(${prefixedKey}), error(${
          (error as Error).message
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
      `set() - Saving Key(${prefixedKey}) with value(${value}) to VegaDataStore`
    );
    AsyncStorage.setItem(prefixedKey, value).catch((error) => {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `set() - Failed to save key(${prefixedKey}) with value(${value}), error: ${
          (error as Error).message
        }`
      );
    });
  }

  delete(key: string): void {
    const prefixedKey = this.getKeyWithPrefix(key);
    Log.debug(
      LOG_EXTENSION,
      LOG_TAG,
      `delete() - Deleting key(${prefixedKey}) from VegaDataStore`
    );
    AsyncStorage.removeItem(prefixedKey).catch((error) => {
      Log.debug(
        LOG_EXTENSION,
        LOG_TAG,
        `delete() - Failed to delete key(${prefixedKey}), error(${(error as Error).message})`
      );
    });
  }
}
