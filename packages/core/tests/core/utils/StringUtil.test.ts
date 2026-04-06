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

import { isNullOrEmptyString, caseInsensitiveEquals } from "../../../src/core/utils/StringUtil";

describe("StringUtil tests", () => {
  test("isNullOrEmptyString", () => {
    expect(isNullOrEmptyString(null)).toBe(true);
    expect(isNullOrEmptyString(undefined)).toBe(true);
    expect(isNullOrEmptyString("")).toBe(true);
    expect(isNullOrEmptyString(" ")).toBe(true);
    expect(isNullOrEmptyString("  ")).toBe(true);
    expect(isNullOrEmptyString("   ")).toBe(true);
    expect(isNullOrEmptyString("a")).toBe(false);
    expect(isNullOrEmptyString(" a")).toBe(false);
    expect(isNullOrEmptyString("a ")).toBe(false);
    expect(isNullOrEmptyString(" a ")).toBe(false);
  });

  test("caseInsensitiveEquals", () => {
    expect(caseInsensitiveEquals("a", "a")).toBe(true);
    expect(caseInsensitiveEquals("a", "A")).toBe(true);
    expect(caseInsensitiveEquals("A", "a")).toBe(true);
    expect(caseInsensitiveEquals("A", "A")).toBe(true);
    expect(caseInsensitiveEquals("aBc.xYZ#123", "abc.xyZ#123")).toBe(true);
    expect(caseInsensitiveEquals("a", "b")).toBe(false);
    expect(caseInsensitiveEquals("a", "B")).toBe(false);
    expect(caseInsensitiveEquals("A", "b")).toBe(false);
    expect(caseInsensitiveEquals("A", "B")).toBe(false);
  });
});
