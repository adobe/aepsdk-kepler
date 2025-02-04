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

import { EdgeExtension } from "../../src/edge/EdgeExtension";
import { Extension, ExtensionContainer } from "../../src/core/extension";
import { DataStore, serviceLookup, ServiceLookup } from "../../src/core/services";
import { Logging } from "../../src/core/services";
import { EdgeStateManager } from "../../src/edge/EdgeStateManager";
import { EdgeResponseManager } from "../../src/edge/EdgeResponseManager";
import { EdgeHitProcessor } from "../../src/edge/EdgeHitProcessor";
import { ConsentManager, ConsentValue } from "../../src/edge/consent/ConsentManager";

jest.mock("../../src/core/extension/ExtensionContainer");
jest.mock("../../src/core/services");
jest.mock("../../src/edge/EdgeResponseManager");
jest.mock("../../src/edge/EdgeStateManager");
jest.mock("../../src/edge/EdgeHitProcessor");
jest.mock("../../src/edge/consent/ConsentManager");

jest.useFakeTimers();

describe("EdgeExtension tests", () => {
  let mockExtensionContainer: jest.Mocked<ExtensionContainer>;
  let mockServiceLookup: jest.Mocked<ServiceLookup>;
  let mockLogging: jest.Mocked<Logging>;
  let mockDataStore: jest.Mocked<DataStore>;
  let mockEdgeResponseManager: jest.Mocked<EdgeResponseManager>;
  let mockEdgeStateManager: jest.Mocked<EdgeStateManager>;
  let mockEdgeHitProcessor: jest.Mocked<EdgeHitProcessor>;
  let mockConsentManager: jest.Mocked<ConsentManager>;

  beforeEach(() => {
    mockExtensionContainer = {
      dispatch: jest.fn(),
      registerEventListener: jest.fn(),
      createXDMSharedState: jest.fn(),
      getXDMSharedState: jest.fn(),
      createPendingXDMSharedState: jest.fn(),
    } as jest.Mocked<ExtensionContainer>;

    mockServiceLookup = {
      getService: jest.fn(),
    } as jest.Mocked<ServiceLookup>;

    mockLogging = {
      setDebugEnabled: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logging>;

    mockDataStore = {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
      getKeys: jest.fn(),
    } as unknown as jest.Mocked<DataStore>;

    mockEdgeResponseManager = {
      handleEdgeResponse: jest.fn(),
      bootUp: jest.fn(),
      getLocationHint: jest.fn(),
      getStateStore: jest.fn(),
    } as unknown as jest.Mocked<EdgeResponseManager>;

    mockEdgeStateManager = {
      process: jest.fn(),
      bootUp: jest.fn(),
      handleConfigurationUpdate: jest.fn(),
      getEdgeDomain: jest.fn(),
      getDatastreamId: jest.fn(),
      getDefaultConsent: jest.fn(),
      getEcid: jest.fn(),
      getIdentityMap: jest.fn(),
      getCollectConsent: jest.fn(),
      updateSharedStateIfChanged: jest.fn(),
    } as unknown as jest.Mocked<EdgeStateManager>;

    mockEdgeHitProcessor = {
      process: jest.fn(),
      isQueueEmpty: jest.fn(),
    } as unknown as jest.Mocked<EdgeHitProcessor>;

    mockConsentManager = {
      bootUp: jest.fn(),
      processConfigurationEvent: jest.fn(),
      processEdgeResponse: jest.fn(),
      getCollectConsent: jest.fn(),
    } as unknown as jest.Mocked<ConsentManager>;

    jest.spyOn(serviceLookup, "getService").mockImplementation((serviceName: string) => {
      if (serviceName === "logging") {
        return mockLogging;
      } else {
        //if (serviceName === "datastore") {
        return mockDataStore;
      }
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  test("EdgeExtension should be defined", () => {
    const edgeExtension: Extension = new EdgeExtension();
    expect(edgeExtension).toBeDefined();
  });

  test("EdgeExtension should have the correct name and version", () => {
    const edgeExtension: Extension = new EdgeExtension();
    expect(edgeExtension.name).toBe("com.adobe.edge");
    expect(edgeExtension.version).toBe("1.0.0-beta.1");
  });

  test("EdgeExtension onRegister should boot up edgeStateManager, edgeResponseManager, register listeners and start hit processing timer", () => {
    const edgeExtension: Extension = new EdgeExtension();

    edgeExtension.onRegister(mockExtensionContainer, mockServiceLookup);

    // 1 for edge request, 1 for hub shared state, 1 for request Identity, 1 for set consent
    expect(mockExtensionContainer.registerEventListener).toHaveBeenCalledTimes(4);

    expect(mockServiceLookup.getService).toHaveBeenCalledWith("dataStore");
  });

  test("startHitProcessingTimer initializes the timer correctly", () => {
    jest.spyOn(EdgeHitProcessor.prototype, "isQueueEmpty").mockReturnValue(false);

    const edgeExtension: EdgeExtension = new EdgeExtension();

    // activate the extension
    edgeExtension.onRegister(mockExtensionContainer, mockServiceLookup);

    // Call the method to test
    edgeExtension.startHitProcessingTimer();

    // Fast-forward timers
    jest.advanceTimersByTime(500);
    expect(EdgeHitProcessor.prototype.process).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(500);
    expect(EdgeHitProcessor.prototype.process).toHaveBeenCalledTimes(2);
  });

  test("startHitProcessingTimer does not create multiple timers if already active", () => {
    jest.spyOn(EdgeHitProcessor.prototype, "isQueueEmpty").mockReturnValue(false);
    mockConsentManager.getCollectConsent.mockReturnValue(ConsentValue.YES);

    const edgeExtension: EdgeExtension = new EdgeExtension();
    // activate the extension
    edgeExtension.onRegister(mockExtensionContainer, mockServiceLookup);

    // Start the timer multiple times
    edgeExtension.startHitProcessingTimer();
    edgeExtension.startHitProcessingTimer();

    jest.advanceTimersByTime(501);
    expect(EdgeHitProcessor.prototype.process).toHaveBeenCalledTimes(1);
  });
});
