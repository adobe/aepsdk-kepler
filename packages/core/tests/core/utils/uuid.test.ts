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
import { serviceLookup, ServiceLookup } from "../../../src/core/services";
jest.mock("../../../src/core/services");

describe("test uuid()", () => {
  let mockServiceLookup: jest.Mocked<ServiceLookup>;

  beforeEach(() => {
    mockServiceLookup = {
      getService: jest.fn(),
    } as jest.Mocked<ServiceLookup>;
    (mockServiceLookup.getService as jest.Mock).mockReturnValue({
      randomUUID: jest.fn().mockReturnValue("123e4567-e89b-12d3-a456-426614174000"),
    });
    (serviceLookup as jest.Mocked<ServiceLookup>).getService = mockServiceLookup.getService;
  });

  test("should call Crypto service to generate UUID", () => {
    uuid();
    expect(mockServiceLookup.getService).toHaveBeenCalledWith("crypto");
  });
});
