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
import { LOG_SOURCE } from "../CoreConstants";
import {
  isFunction,
  isMap,
  isSymbol,
} from "../utils/TypeCheck";

import { getDataObject, getNumber, getString, getBoolean, getNull, getArray } from "../utils/DataObjectUtil";

const LOG_TAG = "EventData";

/**
 * The DataType type presents the supported value types of the DataObject interface.
 */
export type DataType = string | number | boolean | null | DataObject | DataArray;

/**
 * The DataObject interface presents a recursive structure that represents the data that can be stored within EventData class.
 */
export interface DataObject {
  [key: string]: DataType;
}

/**
 * The DataArray type presents an array of DataType.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DataArray extends Array<DataType> { }
/**
 * The EventData class is a wrapper class that stores the data in a recursive structure.
 */
export class EventData {

  private constructor(private data: DataObject) { }

  /**
   * This method creates an EventData object from a JSON object that conforms to the "Record<string, any>" type.
   *
   * @param jsonObj The "Record<string, any>" object that conforms to JSON object.
   * @returns An EventData object if the input is a valid JSON object, otherwise null.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static buildFrom(jsonObj: Record<string, any>): EventData | null {
    try {
      const data: DataObject = JSON.parse(
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
        LOG_SOURCE,
        LOG_TAG,
        `Failed to create an EventData object with a JSON object (${jsonObj}), error: ${(error as Error).message
        }`
      );
      return null;
    }
  }

  public getData(): DataObject {
    return this.data;
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
        LOG_SOURCE,
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
  public updateData(key: string[], value: DataType): void {
    let current = this.data;
    for (let i = 0; i < key.length - 1; i++) {
      if (current[key[i]] === undefined) {
        current[key[i]] = {};
      }
      current = current[key[i]] as DataObject;
    }
    current[key[key.length - 1]] = value;
  }

  //TODO: let's add this method if we have a specific use case for it.
  // public removeData(key: string): void {}

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The DataObject object that is stored in the given path.
   */
  public getDataObject(...key: string[]): DataObject | undefined {
    return getDataObject(this.data, ...key);
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The number that is stored in the given path, otherwise undefined.
   */
  public getNumber(...key: string[]): number | undefined {
    return getNumber(this.data, ...key);
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The string that is stored in the given path, otherwise undefined.
   */
  public getString(...key: string[]): string | undefined {
    return getString(this.data, ...key);
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public getBoolean(...key: string[]): boolean | undefined {
    return getBoolean(this.data, ...key);
  }

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public getNull(...key: string[]): boolean | undefined {
    return getNull(this.data, ...key);
  }

  //TODO: let's add this method if we have a specific use case for it.
  // public isUndefined(...key: string[]): boolean | undefined {}

  /**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The boolean that is stored in the given path, otherwise undefined.
   */
  public getArray(...key: string[]): DataArray | undefined {
    return getArray(this.data, ...key);
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
        LOG_SOURCE,
        LOG_TAG,
        `Failed to convert the EventData object to a JSON string, error: ${(error as Error).message
        }`
      );
      return "";
    }
  }
}
