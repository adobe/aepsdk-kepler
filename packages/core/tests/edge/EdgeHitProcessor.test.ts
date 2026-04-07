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

import { EdgeHit, EdgeHitType } from "../../src/edge/EdgeHit";
import { EdgeHitProcessor } from "../../src/edge/EdgeHitProcessor";
import { EdgeResponseManager } from "../../src/edge/EdgeResponseManager";
import { ConsentManager, ConsentValue } from "../../src/edge/consent/ConsentManager";
import { DataStore } from "../../src/core/services/DataStore";
import { IdentityManager } from "../../src/edge/identity/IdentityManager";
import { LocationHintManager } from "../../src/edge/LocationHintManager";
import { StateStoreManager } from "../../src/edge/StateStoreManager";
import { asyncRequest } from "../../src/core/utils/networking";
import { EdgeStateManager } from "../../src/edge/EdgeStateManager";
import { EdgeConstants } from "../../src/edge/EdgeConstants";

jest.mock("../../src/core/utils/networking");
jest.mock("../../src/core/services/DataStore");
jest.mock("../../src/edge/identity/IdentityManager");
jest.mock("../../src/edge/consent/ConsentManager");
jest.mock("../../src/edge/LocationHintManager");
jest.mock("../../src/edge/StateStoreManager");
jest.mock("../../src/edge/EdgeStateManager");
jest.mock("../../src/edge/EdgeResponseManager");

const extensionVersion = EdgeConstants.EXTENSION_VERSION;
// Matches ImplementationDetails (core-only in this test suite: no aepmedia in node resolution)
const expectedImplementationVersion = `aepcore-${extensionVersion}`;

jest.mock("../../src/edge/network-handling/ImplementationDetails", () => {
  const { EdgeConstants: EdgeConstantsMock } = require("../../src/edge/EdgeConstants");
  return {
    getImplementationDetails: () => ({
      name: "https://ns.adobe.com/experience/mobilesdk/js",
      version: `aepcore-${EdgeConstantsMock.EXTENSION_VERSION}`,
      environment: "app",
    }),
  };
});
describe("EdgeHitProcessor tests", () => {
  let mockAsyncRequest: jest.MockedFunction<typeof asyncRequest>;
  let mockDataStore: jest.Mocked<DataStore>;
  let mockConsentManager: jest.Mocked<ConsentManager>;
  let mockIdentityManager: jest.Mocked<IdentityManager>;
  let mockLocationHintManager: jest.Mocked<LocationHintManager>;
  let mockStateStoreManager: jest.Mocked<StateStoreManager>;
  let mockEdgeStateManager: jest.Mocked<EdgeStateManager>;
  let mockEdgeResponseManager: jest.Mocked<EdgeResponseManager>;
  const mockDispatchFn: jest.Mock = jest.fn();
  const mockCreateSharedState: jest.Mock = jest.fn();

  beforeEach(() => {
    mockAsyncRequest = asyncRequest as jest.MockedFunction<typeof asyncRequest>;

    mockDataStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<DataStore>;

    mockConsentManager = new ConsentManager(
      mockDataStore,
      mockDispatchFn
    ) as jest.Mocked<ConsentManager>;
    jest.spyOn(mockConsentManager, "getCollectConsent").mockReturnValue(ConsentValue.YES);

    mockIdentityManager = new IdentityManager(
      mockDataStore,
      mockDispatchFn
    ) as jest.Mocked<IdentityManager>;
    jest.spyOn(mockIdentityManager, "getIdentityMap").mockReturnValue(null);

    mockLocationHintManager = new LocationHintManager(
      mockDataStore
    ) as jest.Mocked<LocationHintManager>;

    mockStateStoreManager = new StateStoreManager(mockDataStore) as jest.Mocked<StateStoreManager>;

    mockEdgeStateManager = new EdgeStateManager(
      mockCreateSharedState,
      mockIdentityManager,
      mockConsentManager
    ) as jest.Mocked<EdgeStateManager>;
    jest.spyOn(mockEdgeStateManager, "getDatastreamId").mockReturnValue("mockConfigId");
    jest.spyOn(mockEdgeStateManager, "getEcid").mockReturnValue("mockECID");
    jest.spyOn(mockEdgeStateManager, "getCollectConsent").mockReturnValue(ConsentValue.YES);

    mockEdgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockEdgeStateManager,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    ) as jest.Mocked<EdgeResponseManager>;

    jest.useFakeTimers({ doNotFake: ['performance'] });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("EdgeHitProcessor should be defined", () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    expect(edgeHitProcessor).toBeDefined();
  });

  test("process should do nothing when queue is empty", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    await edgeHitProcessor.process();
  });

  test("should queue edge and consent hits correctly", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const edgeHit = EdgeHit.builder("requestId1", {}, Date.now()).setType(EdgeHitType.EDGE).build();
    const consentHit = EdgeHit.builder("requestId2", {}, Date.now())
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(edgeHit);
    edgeHitProcessor.queueHit(consentHit);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(1);
  });

  test("process should send edge hit to edge network and remove it from queue", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/interact?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send edge hit with ECID when available to edge network and remove it from queue", async () => {
    // Mock ECID is available
    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/v1/interact?configId=mockConfigId&requestId=requestId1"
    );
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send all the queued hits", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();
    edgeHitProcessor.queueHit(edgeHit);

    const testTS2 = Date.now();
    const edgeHit2 = EdgeHit.builder(
      "requestId2",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS2 },
      testTS2
    ).build();

    edgeHitProcessor.queueHit(edgeHit2);

    const testTS3 = Date.now();
    const edgeHit3 = EdgeHit.builder(
      "requestId3",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS3 },
      testTS3
    ).build();

    edgeHitProcessor.queueHit(edgeHit3);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(3);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(3);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(3);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(3);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(3);
  });

  test("process should send consent hit to edge network and remove it from queue", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const consentHit = EdgeHit.builder(
      "requestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]},"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send consent hit with ecid when available to edge network and remove it from queue", async () => {
    // Mock ECID is available
    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const consentHit = EdgeHit.builder(
      "requestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"query":{"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should not send edge hit and drop edge hit to edge network, but should send consent hit when consent is 'n'", async () => {
    jest.spyOn(mockEdgeStateManager, "getCollectConsent").mockReturnValue(ConsentValue.NO);

    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "edgeRequestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    const consentHit = EdgeHit.builder(
      "consentRequestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "n",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(2); // 1 for edge hit and 1 for consent hit
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]},"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"n"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should not send edge hit but should send consent hit to edge network when consent is p", async () => {
    jest.spyOn(mockEdgeStateManager, "getCollectConsent").mockReturnValue(ConsentValue.PENDING);

    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "edgeRequestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    const consentHit = EdgeHit.builder(
      "consentRequestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(false);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(2); // 1 for edge hit and 1 for consent hit
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]},"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("test queueHit when max queue size is reached", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    jest.spyOn(edgeHitProcessor, "queueHit");

    for (let i = 0; i < 100; i++) {
      const edgeHit = EdgeHit.builder(`requestId${i + 1}`, {}, Date.now()).build();
      edgeHitProcessor.queueHit(edgeHit);
    }

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(100);

    const edgeHit101 = EdgeHit.builder("requestId101", {}, Date.now()).build();
    edgeHitProcessor.queueHit(edgeHit101);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(100);
    expect(edgeHitProcessor.queueHit).toHaveBeenCalledTimes(101);
    expect(edgeHitProcessor.queueHit).toHaveBeenLastCalledWith(edgeHit101);
  });

  test("test queueHit when max queue size is reached for consent queue", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    jest.spyOn(edgeHitProcessor, "queueHit");

    for (let i = 0; i < 100; i++) {
      const consentHit = EdgeHit.builder(`requestId${i + 1}`, {}, Date.now())
        .setType(EdgeHitType.CONSENT)
        .build();
      edgeHitProcessor.queueHit(consentHit);
    }

    expect(edgeHitProcessor.getConsentQueueSize()).toBe(100);

    const consentHit101 = EdgeHit.builder("requestId101", {}, Date.now())
      .setType(EdgeHitType.CONSENT)
      .build();
    edgeHitProcessor.queueHit(consentHit101);

    expect(edgeHitProcessor.getConsentQueueSize()).toBe(100);
    expect(edgeHitProcessor.queueHit).toHaveBeenCalledTimes(101);
    expect(edgeHitProcessor.queueHit).toHaveBeenLastCalledWith(consentHit101);
  });

  test("process should send edge hit with location hint when location hint is present", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeResponseManager.getLocationHint.mockReturnValue("mockLocationHint");

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain(
      "https://edge.adobedc.net/ee/mockLocationHint/v1/interact?configId"
    );
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send consent hit with location hint when location hint is present", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const consentHit = EdgeHit.builder(
      "requestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockEdgeResponseManager.getLocationHint.mockReturnValue("mockLocationHint");

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain(
      "https://edge.adobedc.net/ee/mockLocationHint/v1/privacy/set-consent?configId"
    );
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]},"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send edge hit with identity map when identity map is present and not add fetch ecid query", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/interact?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send consent hit with identity map when identity map is present and not add fetch ecid query", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const consentHit = EdgeHit.builder(
      "requestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"query":{"consent":{"operation":"update"}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send edge hit with state store when state store is present", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeResponseManager.getStateStore.mockReturnValue([
      {
        key: "kndctr_1234_AdobeOrg_cluster",
        value: "or2",
        maxAge: 1800,
      },
      {
        key: "kndctr_1234_AdobeOrg_identity",
        value: "123456789abcdef",
        maxAge: 1800,
      },
    ]);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/interact?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]}},"meta":{"state":{"entries":[{"key":"kndctr_1234_AdobeOrg_cluster","value":"or2","maxAge":1800},{"key":"kndctr_1234_AdobeOrg_identity","value":"123456789abcdef","maxAge":1800}]}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should send consent hit with state store when state store is present", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const consentHit = EdgeHit.builder(
      "requestId1",
      {
        consent: [
          {
            standard: "Adobe",
            version: "2.0",
            value: {
              collect: {
                val: "y",
              },
              metadata: {
                time: testTS,
              },
            },
          },
        ],
      },
      testTS
    )
      .setType(EdgeHitType.CONSENT)
      .build();

    edgeHitProcessor.queueHit(consentHit);

    mockEdgeResponseManager.getStateStore.mockReturnValue([
      {
        key: "kndctr_1234_AdobeOrg_cluster",
        value: "or2",
        maxAge: 1800,
      },
      {
        key: "kndctr_1234_AdobeOrg_identity",
        value: "123456789abcdef",
        maxAge: 1800,
      },
    ]);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;

    expect(actualUrl).toContain("https://edge.adobedc.net/ee/v1/privacy/set-consent?configId");
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"}},"query":{"identity":{"fetch":["ECID"]},"consent":{"operation":"update"}},"meta":{"state":{"entries":[{"key":"kndctr_1234_AdobeOrg_cluster","value":"or2","maxAge":1800},{"key":"kndctr_1234_AdobeOrg_identity","value":"123456789abcdef","maxAge":1800}]}},"consent":[{"standard":"Adobe","version":"2.0","value":{"collect":{"val":"y"},"metadata":{"time":${testTS}}}}]}`
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
  });

  test("process should override the datastream id if presented", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    )
      .setDatastreamIdOverride("newDatastreamId")
      .build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;

    console.log(actualUrl);
    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/v1/interact?configId=newDatastreamId&requestId=requestId1"
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
    console.log(actualBody);
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"meta":{"sdkConfig":{"datastream":{"original":"mockConfigId"}}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
  });

  test("process should override the datastream config if presented", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    )
      .setDatastreamConfigOverride({
        com_adobe_experience_platform: {
          datasets: {
            event: {
              datasetId: "new_dataset_id",
            },
          },
        },
      })
      .build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;

    console.log(actualUrl);
    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/v1/interact?configId=mockConfigId&requestId=requestId1"
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
    console.log(actualBody);
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"meta":{"configOverrides":{"com_adobe_experience_platform":{"datasets":{"event":{"datasetId":"new_dataset_id"}}}}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
  });

  test("process should override the datastream config and the datastream id if both presented", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    )
      .setDatastreamIdOverride("newDatastreamId")
      .setDatastreamConfigOverride({
        com_adobe_experience_platform: {
          datasets: {
            event: {
              datasetId: "new_dataset_id",
            },
          },
        },
      })
      .build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;

    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/v1/interact?configId=newDatastreamId&requestId=requestId1"
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
    console.log(actualBody);
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"meta":{"configOverrides":{"com_adobe_experience_platform":{"datasets":{"event":{"datasetId":"new_dataset_id"}}}},"sdkConfig":{"datastream":{"original":"mockConfigId"}}},"events":[{"xdm":{"key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
  });

  test("process should send edge hit with custom path when overwrite path is present", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "mediaRequestId",
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
        data: { key: "value" },
        timestamp: testTS,
      },
      testTS
    )
      .setPath("/va/v1/sessionStart")
      .build();

    edgeHitProcessor.queueHit(edgeHit);

    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(1);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(1);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(1);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;

    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/va/v1/sessionStart?configId=mockConfigId&requestId=mediaRequestId"
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
    console.log(actualBody);
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"events":[{"xdm":{"eventType":"media.sessionStart","key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
  });

  test("process should send edge hit with custom path and location hint when both are set", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "mediaRequestId",
      {
        xdm: {
          eventType: "media.sessionStart",
          key: "value",
        },
        data: { key: "value" },
        timestamp: testTS,
      },
      testTS
    )
      .setPath("/va/v1/sessionStart")
      .build();

    mockEdgeResponseManager.getLocationHint.mockReturnValue("mockLocationHint");
    edgeHitProcessor.queueHit(edgeHit);

    // mock ECID presence
    mockEdgeStateManager.getIdentityMap.mockReturnValue({
      ECID: [
        {
          authenticatedState: "ambiguous",
          id: "mockECID",
          primary: true,
        },
      ],
    });

    mockAsyncRequest.mockResolvedValue({
      responseCode: 200,
      bodyAsText: "{}",
    });

    const success = await edgeHitProcessor.process();
    expect(success).toBe(true);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
    expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

    const actualUrl = mockAsyncRequest.mock.calls[0][0]["url"] as string;
    const actualMethod = mockAsyncRequest.mock.calls[0][0]["method"] as string;
    const actualTimeout = mockAsyncRequest.mock.calls[0][0]["timeout"] as number;
    const actualBody = mockAsyncRequest.mock.calls[0][0]["body"] as string;

    expect(actualUrl).toEqual(
      "https://edge.adobedc.net/ee/mockLocationHint/va/v1/sessionStart?configId=mockConfigId&requestId=mediaRequestId"
    );
    expect(actualMethod).toEqual("POST");
    expect(actualTimeout).toEqual(5000);
    console.log(actualBody);
    expect(actualBody).toEqual(
      `{"xdm":{"implementationDetails":{"name":"https://ns.adobe.com/experience/mobilesdk/js","version":"${expectedImplementationVersion}","environment":"app"},"identityMap":{"ECID":[{"authenticatedState":"ambiguous","id":"mockECID","primary":true}]}},"events":[{"xdm":{"eventType":"media.sessionStart","key":"value"},"data":{"key":"value"},"timestamp":${testTS}}]}`
    );
  });

  test("Request should be retried after 30 seconds when it fails with recoverable error", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockAsyncRequest
      .mockResolvedValueOnce({
        responseCode: 500,
        bodyAsText: "Internal Server Error",
      })
      .mockResolvedValueOnce({
        responseCode: 200,
        bodyAsText: "{}",
      });

    await edgeHitProcessor.process();
    // async request should not be called the second time
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);
    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1);

    // Simulate the retry timeout
    // wait for 25 seconds
    jest.advanceTimersByTime(25000);
    await edgeHitProcessor.process();

    // async request should not be called the second time
    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);
    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1); // edgeHit is still in the queue to be retried

    // wait for 5 more seconds (total 30 seconds)
    jest.advanceTimersByTime(5000);
    await edgeHitProcessor.process();

    expect(mockAsyncRequest).toHaveBeenCalledTimes(2); // 1 for the first call and 1 for the retry

    expect(mockEdgeStateManager.getCollectConsent).toHaveBeenCalledTimes(2);
    expect(mockEdgeStateManager.getIdentityMap).toHaveBeenCalledTimes(2);
    expect(mockEdgeResponseManager.getLocationHint).toHaveBeenCalledTimes(2);
    expect(mockEdgeResponseManager.getStateStore).toHaveBeenCalledTimes(2);

    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
  });

  test("Request should not be retried when it fails with non-recoverable error", async () => {
    const edgeHitProcessor = new EdgeHitProcessor(mockEdgeResponseManager, mockEdgeStateManager);

    const testTS = Date.now();
    const edgeHit = EdgeHit.builder(
      "requestId1",
      { xdm: { key: "value" }, data: { key: "value" }, timestamp: testTS },
      testTS
    ).build();

    edgeHitProcessor.queueHit(edgeHit);

    mockAsyncRequest.mockResolvedValue({
      responseCode: 400,
      bodyAsText: "Bad Request",
    });

    await edgeHitProcessor.process();

    expect(mockAsyncRequest).toHaveBeenCalledTimes(1);
    expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0); // edge hit should be dropped
  });
});
