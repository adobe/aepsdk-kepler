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

export function isString(value: unknown): boolean {
  return typeof value === "string";
}

export function isBoolean(value: unknown): boolean {
  return typeof value === "boolean";
}

export function isArray(value: unknown): boolean {
  return Array.isArray(value);
}

export function isNumber(value: unknown): boolean {
  return typeof value === "number";
}

export function isObject(value: unknown): boolean {
  return value !== null && typeof value === "object" && !isArray(value);
}

export function isUndefined(value: unknown): boolean {
  return value === undefined;
}

export function isFunction(value: unknown): boolean {
  return typeof value === "function";
}

export function isSymbol(value: unknown): boolean {
  return typeof value === "symbol";
}

export function isMap(value: unknown): boolean {
  return value instanceof Map;
}
