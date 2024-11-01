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

import { isArray, isString, isBoolean, isNumber, isUndefined, isFunction, isMap, isSymbol, isObject } from '../../../src/core/utils/Types';

const EMPTY_ARRAY: unknown = [];
const ARRAY: unknown = [1, '', true, null, {}, []];
const OBJECT: unknown = {
    key: 'value',
};
const STRING: unknown = 'this is a string';
const NULL: unknown = null;
const UNDEFINED: unknown = undefined;
const DATE: unknown = new Date();
const MAP: unknown = new Map();
const BOOLEAN: unknown = true;
const NUMBER: unknown = 1;
const FUNCTION: unknown = () => { };
const SYMBOL: unknown = Symbol('symbol');

describe('test Types utils', () => {
    it('isArray() - should work', () => {
        expect(isArray(EMPTY_ARRAY)).toBe(true);
        expect(isArray(ARRAY)).toBe(true);
        expect(isArray(OBJECT)).toBe(false);
        expect(isArray(STRING)).toBe(false);
        expect(isArray(NULL)).toBe(false);
        expect(isArray(UNDEFINED)).toBe(false);
        expect(isArray(DATE)).toBe(false);
        expect(isArray(MAP)).toBe(false);
        expect(isArray(BOOLEAN)).toBe(false);
        expect(isArray(NUMBER)).toBe(false);
        expect(isArray(FUNCTION)).toBe(false);
        expect(isArray(SYMBOL)).toBe(false);
    });
    it('isString() - should work', () => {
        expect(isString(ARRAY)).toBe(false);
        expect(isString(OBJECT)).toBe(false);
        expect(isString(STRING)).toBe(true);
        expect(isString(NULL)).toBe(false);
        expect(isString(UNDEFINED)).toBe(false);
        expect(isString(DATE)).toBe(false);
        expect(isString(MAP)).toBe(false);
        expect(isString(BOOLEAN)).toBe(false);
        expect(isString(NUMBER)).toBe(false);
        expect(isString(FUNCTION)).toBe(false);
        expect(isString(SYMBOL)).toBe(false);
    });

    it('isBoolean() - should work', () => {
        expect(isBoolean(ARRAY)).toBe(false);
        expect(isBoolean(OBJECT)).toBe(false);
        expect(isBoolean(STRING)).toBe(false);
        expect(isBoolean(NULL)).toBe(false);
        expect(isBoolean(UNDEFINED)).toBe(false);
        expect(isBoolean(DATE)).toBe(false);
        expect(isBoolean(MAP)).toBe(false);
        expect(isBoolean(BOOLEAN)).toBe(true);
        expect(isBoolean(NUMBER)).toBe(false);
        expect(isBoolean(FUNCTION)).toBe(false);
        expect(isBoolean(SYMBOL)).toBe(false);
    });
    it('isUndefined() - should work', () => {
        expect(isUndefined(ARRAY)).toBe(false);
        expect(isUndefined(OBJECT)).toBe(false);
        expect(isUndefined(STRING)).toBe(false);
        expect(isUndefined(NULL)).toBe(false);
        expect(isUndefined(UNDEFINED)).toBe(true);
        expect(isUndefined(DATE)).toBe(false);
        expect(isUndefined(MAP)).toBe(false);
        expect(isUndefined(BOOLEAN)).toBe(false);
        expect(isUndefined(NUMBER)).toBe(false);
        expect(isUndefined(FUNCTION)).toBe(false);
        expect(isUndefined(SYMBOL)).toBe(false);
    });

    it('isNumber() - should work', () => {
        expect(isNumber(ARRAY)).toBe(false);
        expect(isNumber(OBJECT)).toBe(false);
        expect(isNumber(STRING)).toBe(false);
        expect(isNumber(NULL)).toBe(false);
        expect(isNumber(UNDEFINED)).toBe(false);
        expect(isNumber(DATE)).toBe(false);
        expect(isNumber(MAP)).toBe(false);
        expect(isNumber(BOOLEAN)).toBe(false);
        expect(isNumber(NUMBER)).toBe(true);
        expect(isNumber(FUNCTION)).toBe(false);
        expect(isNumber(SYMBOL)).toBe(false);
    });

    it('isFunction() - should work', () => {
        expect(isFunction(ARRAY)).toBe(false);
        expect(isFunction(OBJECT)).toBe(false);
        expect(isFunction(STRING)).toBe(false);
        expect(isFunction(NULL)).toBe(false);
        expect(isFunction(UNDEFINED)).toBe(false);
        expect(isFunction(DATE)).toBe(false);
        expect(isFunction(MAP)).toBe(false);
        expect(isFunction(BOOLEAN)).toBe(false);
        expect(isFunction(NUMBER)).toBe(false);
        expect(isFunction(FUNCTION)).toBe(true);
        expect(isFunction(SYMBOL)).toBe(false);
    });

    it('isMap() - should work', () => {
        expect(isMap(ARRAY)).toBe(false);
        expect(isMap(OBJECT)).toBe(false);
        expect(isMap(STRING)).toBe(false);
        expect(isMap(NULL)).toBe(false);
        expect(isMap(UNDEFINED)).toBe(false);
        expect(isMap(DATE)).toBe(false);
        expect(isMap(MAP)).toBe(true);
        expect(isMap(BOOLEAN)).toBe(false);
        expect(isMap(NUMBER)).toBe(false);
        expect(isMap(FUNCTION)).toBe(false);
        expect(isMap(SYMBOL)).toBe(false);
    });

    it('isSymbol() - should work', () => {
        expect(isSymbol(ARRAY)).toBe(false);
        expect(isSymbol(OBJECT)).toBe(false);
        expect(isSymbol(STRING)).toBe(false);
        expect(isSymbol(NULL)).toBe(false);
        expect(isSymbol(UNDEFINED)).toBe(false);
        expect(isSymbol(DATE)).toBe(false);
        expect(isSymbol(MAP)).toBe(false);
        expect(isSymbol(BOOLEAN)).toBe(false);
        expect(isSymbol(NUMBER)).toBe(false);
        expect(isSymbol(FUNCTION)).toBe(false);
        expect(isSymbol(SYMBOL)).toBe(true);
    });

    it('isObject() - should work', () => {
        expect(isObject(ARRAY)).toBe(true);
        expect(isObject(OBJECT)).toBe(true);
        expect(isObject(DATE)).toBe(true);
        expect(isObject(MAP)).toBe(true);

        expect(isObject(STRING)).toBe(false);
        expect(isObject(NULL)).toBe(false);
        expect(isObject(UNDEFINED)).toBe(false);
        expect(isObject(BOOLEAN)).toBe(false);
        expect(isObject(NUMBER)).toBe(false);
        expect(isObject(FUNCTION)).toBe(false);
        expect(isObject(SYMBOL)).toBe(false);
    });
});