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

import { CoreConstants } from "../CoreConstants";
import { Log } from "./Log";

const LOG_TAG = "MapUtil";
const LOG_SOURCE = CoreConstants.EXTENSION_NAME;

/**
 * Check if a map is null or empty.
 * @param map the map to check
 * @returns true if the map is null or empty, false otherwise
 */
const isNullOrEmptyMap = (map: Map<string, any> | null | undefined): boolean => {
  return map === undefined || map === null || map.size === 0;
};

/**
 * Converts an object to a Map. If the object is already a Map, it will recursively convert its entries.
 * @param obj the object to convert
 * @returns a Map representation of the object
 */
const mapFromObject = (obj: Record<string, any>): Map<string, any> | null => {
  const result = convertToMap(obj);
  return result instanceof Map ? result : null;
};

/**
 * Returns a Map from the object's key. If the key is not found, it returns the fallback.
 * @param obj the object to extract the map from
 * @param key the key to extract the map from
 * @param fallback the fallback value if the key is not found
 * @returns a Map representation of the object's key
 * @returns the fallback value if the key is not found
 */
const optMap = (
  obj: Record<string, any>,
  key: string,
  fallback: Map<string, any> | null = new Map()
): Map<string, any> | null => {
  if (typeof obj === null && typeof obj !== "object") {
    return fallback;
  }

  var input = mapFromObject(obj);

  const result = input?.get(key);
  if (result === undefined || result === null || !(result instanceof Map)) {
    return fallback;
  }

  return result;
};

/**
 * Converts an object to a Map. If the object is already a Map, it will recursively convert its entries.
 * @param input the object to convert
 * @returns a Map representation of the object
 * @returns null if the object is null, undefined, or a function
 * @returns the object as is if it's not convertible to a Map
 */
const convertToMap = (input: any): Map<string, any> | null => {
  try {
    // TODO: Handle circular references to avoid infinite loops
    if (input === null || input === undefined || input instanceof Function) {
      return null;
    } else if (typeof input !== "object" || !isMapCompatible(input)) {
      return input;
    } else if (input instanceof Map) {
      // If the input is already a Map, return it, but recursively process its entries
      const resultMap = new Map();
      for (const [key, value] of input.entries()) {
        if (isRestrictedType(value)) {
          continue;
        }

        resultMap.set(key, convertToMap(value)); // Recursively convert nested objects
      }
      return resultMap;
    } else if (typeof input === "object") {
      // If it's an object, convert it to a Map and process recursively
      const resultMap = new Map<string, any>();
      for (const [key, value] of Object.entries(input)) {
        if (isRestrictedType(value)) {
          continue;
        }

        resultMap.set(key, convertToMap(value));
      }
      return resultMap;
    }
  } catch (error) {
    Log.error(LOG_SOURCE, LOG_TAG, `Error converting object to Map: ${error}`);
    return null;
  }

  return null;
};

/**
 * Converts a Map to an object.
 * @param map the Map to convert
 * @returns an object representation of the Map
 */
const mapToObject = (map: Map<string, any>): Record<string, any> => {
  const obj: Record<string, any> = {};
  for (const [key, value] of map) {
    obj[key] = value instanceof Map ? mapToObject(value) : value;
  }
  return obj;
};

/**
 * Converts a Map to a JSON string.
 * @param map the Map to convert
 * @returns a JSON string representation of the Map
 * @returns null if the Map is invalid
 */
const mapToJson = (map: Map<string, any>): string | null => {
  if (!(map instanceof Map)) {
    return null;
  }

  try {
    return JSON.stringify(mapToObject(map));
  } catch (error) {
    Log.error(LOG_SOURCE, LOG_TAG, `Error converting Map to JSON: ${error}`);
    return null;
  }
};

/**
 * Converts a JSON string to a Map.
 * @param json the JSON string to convert
 * @returns a Map representation of the JSON string
 * @returns null if the JSON string is invalid
 */
const mapFromJson = (json: string): Map<string, any> | null => {
  try {
    const obj = JSON.parse(json);
    return convertToMap(obj) as Map<string, any>;
  } catch (error) {
    Log.error(LOG_SOURCE, LOG_TAG, `Error converting JSON to Map: ${error}`);
    return null;
  }
};

/**
 * Checks if the value is compatible with a Map.
 * @param value the value to check
 * @returns true if the value is compatible with a Map, false otherwise
 */
const isMapCompatible = (value: any): boolean => {
  return !(
    value instanceof Date ||
    value instanceof RegExp ||
    Array.isArray(value) ||
    value instanceof Set
  );
};

/**
 * Checks if the value is a restricted type.
 * @param value the value to check
 * @returns true if the value is a restricted type, false otherwise
 */
const isRestrictedType = (value: any): boolean => {
  return value instanceof Function;
};

export { isNullOrEmptyMap, optMap, mapToObject, mapFromObject, mapToJson, mapFromJson };
