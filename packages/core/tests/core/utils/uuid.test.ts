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
import { uuid } from "../../../src/core/utils/uuid";

describe("test uuid()", () => {
  test("should generate a string", () => {
    const id = uuid();
    expect(typeof id).toBe("string");
  });

  test("should generate a valid version 4 UUID", () => {
    const id = uuid();
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV4Regex);
  });

  test("should generate different UUIDs on multiple calls", () => {
    const id1 = uuid();
    const id2 = uuid();
    expect(id1).not.toBe(id2);
  });
});
