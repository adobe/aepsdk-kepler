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
import { safeStringify } from "../../../src/core/utils/common";

describe("test common.ts", () => {
  it("safeStringify() - should return string if the input is a standard JSON object", () => {
    const output = safeStringify({
      key: "value",
    });
    expect(output).not.toBe("");
  });

  it("safeStringify() - should return error message if the input is not a standard JSON object ", () => {
    const circularReference = {
      myself: null as unknown,
    };
    circularReference.myself = circularReference;
    const output = safeStringify(circularReference);
    expect(output).toBe("");
  });
});
