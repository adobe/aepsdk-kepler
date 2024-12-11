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

import { DataObject } from "../eventhub/EventData";
import { isObject, isArray, isNumber, isString, isBoolean } from "./TypeCheck";

export const getAsDataObject = (input: unknown): DataObject | null => {
  return isObject(input) && !isArray(input) ? (input as DataObject) : null;
};

export const getAsDataArray = (input: unknown): DataObject[] | null => {
  return isArray(input) ? (input as DataObject[]) : null;
};

export const getAsString = (input: unknown): string | null => {
  return isString(input) ? (input as string) : null;
};

export const getAsNumber = (input: unknown): number | null => {
  return isNumber(input) ? (input as number) : null;
};

export const getAsBoolean = (input: unknown): boolean | null => {
  return isBoolean(input) ? (input as boolean) : null;
};

export const isNullOrEmptyObject = (input: unknown): boolean => {
  return !isObject(input) || Object.keys(input as DataObject).length === 0;
};

export const isPositiveWholeNumber = (input: unknown): boolean => {
  return isNumber(input) && Number.isInteger(input as number) && (input as number) > 0;
};
