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

import { DataObject, DataArray, DataType } from "../eventhub/EventData";
import { Log } from "./Log";
import { CoreConstants } from "../CoreConstants";

import {
    isArray,
    isString,
    isBoolean,
    isNumber,
    isUndefined,
    isObject,
} from "./TypeCheck";

const LOG_TAG = "DataObjectUtil";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

/**
 * 
 * @param json The JSON string that needs to be parsed to a DataObject.
 * @returns The DataObject object if the input is a valid JSON string, otherwise null.
 */
export function buildDataObject(json: string): DataObject | null {
    try {
        return JSON.parse(json) as DataObject;
    } catch (error) {
        Log.error(LOG_SOURCE, LOG_TAG, `Failed to parse JSON string: (${json}) , error message: ${(error as Error).message}`);
    }
    return null;
}

/**
   *
   * @param key The path to the data that needs to be retrieved.
   * @returns The data that is stored in the given path.
   */
function getDataType(root: DataObject, ...key: string[]): DataType | undefined {
    if (key.length === 0) {
        return root;
    }

    let current = root;
    for (let i = 0; i < key.length - 1; i++) {
        if (isObject(current[key[i]])) {
            current = current[key[i]] as DataObject;
        } else {
            return undefined;
        }
    }
    return current[key[key.length - 1]] as DataType | undefined;
}

/**
   *
   * @param data The data object to be performed the operation on.
   * @param key The path to the data that needs to be retrieved.
   * @returns The DataObject object that is stored in the given path.
   */
export function getDataObject(data: DataObject, ...key: string[]): DataObject | undefined {
    const value = getDataType(data, ...key);
    if (isObject(value)) {
        return value as DataObject;
    }
    return undefined;
}

/**
   *
   * @param data The data object to be performed the operation on.
   * @param key The path to the data that needs to be retrieved.
   * @returns The number that is stored in the given path, otherwise undefined.
   */
export function getNumber(data: DataObject, ...key: string[]): number | undefined {
    const value = getDataType(data, ...key);
    if (isNumber(value)) {
        return value as number;
    }
    return undefined;
}

/**
   *
   * @param data The data object to be performed the operation on.
   * @param key The path to the data that needs to be retrieved.
   * @returns The string that is stored in the given path, otherwise undefined.
   */
export function getString(data: DataObject, ...key: string[]): string | undefined {
    const value = getDataType(data, ...key);
    if (isString(value)) {
        return value as string;
    }
    return undefined;
}

/**
 *
 * @param data The data object to be performed the operation on.
 * @param key The path to the data that needs to be retrieved.
 * @returns The boolean that is stored in the given path, otherwise undefined.
 */
export function getBoolean(data: DataObject, ...key: string[]): boolean | undefined {
    const value = getDataType(data, ...key);
    if (isBoolean(value)) {
        return value as boolean;
    }
    return undefined;
}

/**
 *
 * @param data The data object to be performed the operation on.
 * @param key The path to the data that needs to be retrieved.
 * @returns The boolean that is stored in the given path, otherwise undefined.
 */
export function getNull(data: DataObject, ...key: string[]): boolean | undefined {
    const value = getDataType(data, ...key);
    if (value === null) {
        return true;
    } else if (isUndefined(value)) {
        return undefined;
    } else {
        return false;
    }
}

/**
 *
 * @param data The data object to be performed the operation on.
 * @param key The path to the data that needs to be retrieved.
 * @returns The boolean that is stored in the given path, otherwise undefined.
 */
export function getArray(data: DataObject, ...key: string[]): DataArray | undefined {
    const value = getDataType(data, ...key);
    if (isArray(value)) {
        return value as DataArray;
    }
    return undefined;
}