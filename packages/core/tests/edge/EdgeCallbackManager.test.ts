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

import { EdgeCallbackManager } from "../../src/edge/EdgeCallbackManager";

describe("EdgeCallbackManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    EdgeCallbackManager.reset();
  });
  test("EdgeCallbackManager getInstance returns instance", async () => {
    const instance = EdgeCallbackManager.getInstance();
    expect(instance).toBeInstanceOf(EdgeCallbackManager);
  });

  test("EdgeCallbackManager getInstance returns same instance", async () => {
    const instance1 = EdgeCallbackManager.getInstance();
    const instance2 = EdgeCallbackManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test("EdgeCallbackManager addCallback adds callback", async () => {
    const instance = EdgeCallbackManager.getInstance();
    const callback = jest.fn();
    instance.registerCallback("test", callback);
    expect(instance.getCallback("test")).toEqual(callback);
  });

  test("EdgeCallbackManager addCallback adds one callback per requestId", async () => {
    const instance = EdgeCallbackManager.getInstance();
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    instance.registerCallback("requestId1", callback1);
    instance.registerCallback("requestId2", callback2);
    expect(instance.getCallback("requestId1")).toEqual(callback1);
    expect(instance.getCallback("requestId2")).toEqual(callback2);
    expect(Object.keys(instance.getCallbackMap()).length).toEqual(2);

    const callback3 = jest.fn();
    const callback4 = jest.fn();

    instance.registerCallback("requestId1", callback3);
    instance.registerCallback("requestId2", callback4);
    expect(instance.getCallback("requestId1")).toEqual(callback3);
    expect(instance.getCallback("requestId2")).toEqual(callback4);
    expect(Object.keys(instance.getCallbackMap()).length).toEqual(2);
  });
});
