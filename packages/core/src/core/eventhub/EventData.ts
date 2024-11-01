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
import { CoreConstants } from "../CoreConstants";
import {
  isArray,
  isString,
  isBoolean,
  isNumber,
  isUndefined,
  isFunction,
  isMap,
  isSymbol,
  isObject,
} from "../utils/Types";

const LOG_TAG = "EventData";
const LOG_EXTENSION = CoreConstants.FRIENDLY_NAME;

/**
 * The DataValue type presents the supported value types of the DataType interface.
 */
export type DataValue = string | number | boolean | null | DataType | DataArray;

/**
 * The DataType interface presents a recursive structure that represents the data that can be stored within EventData class.
 */
export interface DataType {
  [key: string]: DataValue;
}

/**
 * The DataArray type presents an array of DataValue.
 */
export interface DataArray extends Array<DataValue> {}

/**
 * The EventData class is a wrapper class that stores the data in a recursive structure.
 */
export class EventData {
  private data: DataType;

  private constructor(data: DataType) {
    this.data = data;
  }

  /**
   * This method creates an EventData object from a JSON object that conforms to the Record<string, any> type.
   *
   * @param jsonObj The JSON object that conforms to the Record<string, any> type.
   * @returns An EventData object if the input is a valid JSON object, otherwise null.
   */
  public static buildFrom(jsonObj: Record<string, any>): EventData | null {
    try {
      const data: DataType = JSON.parse(
        JSON.stringify(jsonObj, (k, v) => {
          if (isFunction(v) || isMap(v) || isSymbol(v)) {
            return undefined;
          }
          // Date objects implement the toJSON() method which returns a string (the same as date.toISOString()). Thus, they will be stringified as strings.
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description
          // Date objects are converted to strings, not found a way to customize the conversion
          return v;
        })
      );
      return new EventData(data);
    } catch (error) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        `Failed to create an EventData object with a JSON object (${jsonObj}), error: ${
          (error as Error).message
        }`
      );
      return null;
    }
  }

  /**
   *
   * @returns A deep copy of the EventData object.
   */
  public clone(): EventData {
    try {
      const deepCopy = JSON.parse(this.convertToJSONString());
      return new EventData(deepCopy);
    } catch (error) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        `Failed to clone the EventData object, error: ${(error as Error).message}`
      );
    }
    return new EventData({});
  }

  /**
   *
   * @param key  The path to the data that needs to be updated.
   * @param value The new value that needs to be updated.
   */
  public updateData(key: string[], value: DataValue): void {
    let current = this.data;
    for (let i = 0; i < key.length - 1; i++) {
      if (current[key[i]] === undefined) {
        current[key[i]] = {};
      }
      current = current[key[i]] as DataType;
    }
    current[key[key.length - 1]] = value;
  }

  //TODO: let's add this method if we have a specific use case for it.
  // public removeData(key: string): void {}

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The data that is stored in the given path.
   */
  private retrieveDataValueFromPath(...key: string[]): DataValue | undefined {
    if (key.length === 0) {
      return this.data;
    }

    let current = this.data;
    for (let i = 0; i < key.length - 1; i++) {
      if (isObject(current[key[i]]) && !isArray(current[key[i]])) {
        current = current[key[i]] as DataType;
      } else {
        return undefined;
      }
    }
    return current[key[key.length - 1]] as DataValue | undefined;
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The DataType object that is stored in the given path.
   */
  public retrieveDataTypeFromPath(...key: string[]): DataType | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (isObject(value) && !isArray(value)) {
      return value as DataType;
    }
    return undefined;
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The number that is stored in the given path, otherwise undefined.
   */
  public retrieveNumberFromPath(...key: string[]): number | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (isNumber(value)) {
      return value as number;
    }
    return undefined;
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The string that is stored in the given path, otherwise undefined.
   */
  public retrieveStringFromPath(...key: string[]): string | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (isString(value)) {
      return value as string;
    }
    return undefined;
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public retrieveBooleanFromPath(...key: string[]): boolean | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (isBoolean(value)) {
      return value as boolean;
    }
    return undefined;
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public isNull(...key: string[]): boolean | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (value === null) {
      return true;
    } else if (isUndefined(value)) {
      return undefined;
    } else {
      return false;
    }
  }

  //TODO: let's add this method if we have a specific use case for it.
  // public isUndefined(...key: string[]): boolean | undefined {}

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public retrieveArrayFromPath(...key: string[]): DataArray | undefined {
    const value = this.retrieveDataValueFromPath(...key);
    if (isArray(value)) {
      return value as DataArray;
    }
    return undefined;
  }

  /**
   *
   * @returns The JSON string representation of the EventData object.
   */
  public toString(): string {
    return this.convertToJSONString();
  }

  private convertToJSONString(): string {
    try {
      return JSON.stringify(this.data);
    } catch (error) {
      Log.error(
        LOG_EXTENSION,
        LOG_TAG,
        `Failed to convert the EventData object to a JSON string, error: ${
          (error as Error).message
        }`
      );
      return "";
    }
  }
}
