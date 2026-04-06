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

import { EdgeStateManager } from "../../src/edge/EdgeStateManager";
import { DataStore } from "../../src/core/services/DataStore";
import { IdentityManager } from "../../src/edge/identity/IdentityManager";
import { ConsentManager, ConsentValue } from "../../src/edge/consent/ConsentManager";
import { EventData } from "../../src/core/eventhub";

jest.mock("../../src/core/services/DataStore");
jest.mock("../../src/edge/identity/IdentityManager");
jest.mock("../../src/edge/consent/ConsentManager");

const configData = EventData.buildFrom({
  "edge.configId": "datastreamId",
  "edge.domain": "edgeDomain",
  "consent.default": {
    consents: {
      collect: {
        val: "p",
      },
    },
  },
});

describe("EdgeStateManager tests", () => {
  let mockDataStore: jest.Mocked<DataStore>;
  let mockConsentManager: jest.Mocked<ConsentManager>;
  let mockIdentityManager: jest.Mocked<IdentityManager>;

  const mockDispatchFn = jest.fn();
  const mockCreateSharedStateFn = jest.fn();

  beforeEach(() => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("EdgeStateManager is defined", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );
    expect(edgeStateManager).toBeDefined();
  });

  test("EdgeStateManager bootUp", async () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    await edgeStateManager.bootUp();
    expect(mockIdentityManager.bootUp).toHaveBeenCalledTimes(1);
    expect(mockConsentManager.bootUp).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager handleConfigurationUpdate with null data", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    edgeStateManager.handleConfigurationUpdate(null);
    expect(mockCreateSharedStateFn).not.toHaveBeenCalled();
  });

  test("EdgeStateManager handleConfigurationUpdate with data", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    edgeStateManager.handleConfigurationUpdate(configData);
    expect(mockCreateSharedStateFn).toHaveBeenCalledTimes(0);
    expect(mockConsentManager.processConfigurationEvent).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager getEdgeDomain", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    edgeStateManager.handleConfigurationUpdate(configData);
    expect(edgeStateManager.getEdgeDomain()).toEqual("edgeDomain");
  });

  test("EdgeStateManager getDatastreamId", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    edgeStateManager.handleConfigurationUpdate(configData);
    expect(edgeStateManager.getDatastreamId()).toEqual("datastreamId");
    expect(mockConsentManager.processConfigurationEvent).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager handle invalid configuration update", () => {
    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    edgeStateManager.handleConfigurationUpdate(null);
    edgeStateManager.handleConfigurationUpdate(EventData.buildFrom({}));
    expect(mockCreateSharedStateFn).not.toHaveBeenCalled();

    expect(edgeStateManager.getEdgeDomain()).toBeNull();
    expect(edgeStateManager.getDatastreamId()).toBeNull();
    expect(mockConsentManager.processConfigurationEvent).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager getEcid", () => {
    jest.spyOn(mockIdentityManager, "getECID").mockReturnValue("ecid");

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    expect(edgeStateManager.getEcid()).toEqual("ecid");
    expect(mockIdentityManager.getECID).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager getIdentityMap", () => {
    jest.spyOn(mockIdentityManager, "getIdentityMap").mockReturnValue({
      identityMap: {
        ECID: {
          id: "ecid",
        },
      },
    });

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    expect(edgeStateManager.getIdentityMap()).toEqual({
      identityMap: {
        ECID: {
          id: "ecid",
        },
      },
    });
    expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager getCollectConsent", () => {
    jest.spyOn(mockConsentManager, "getCollectConsent").mockReturnValue(ConsentValue.YES);

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    expect(edgeStateManager.getCollectConsent()).toEqual(ConsentValue.YES);
    expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
  });

  test("EdgeStateManager updateSharedStateIfChanged updates shared state when ECID changes", () => {
    jest.spyOn(mockIdentityManager, "getECID").mockReturnValue("ECID");

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    // ecid was null before and now it is set
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState = {
      ecid: "ECID",
      "consent.collect": "y",
    };

    expect(mockCreateSharedStateFn).toHaveBeenCalledWith(expectedSharedState, null);
  });

  test("EdgeStateManager updateSharedStateIfChanged updates shared state when collect consent changes", () => {
    jest.spyOn(mockConsentManager, "getCollectConsent").mockReturnValue(ConsentValue.YES);

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    // collect consent was p before and now it is y
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState = {
      "consent.collect": "y",
    };

    expect(mockCreateSharedStateFn).toHaveBeenCalledWith(expectedSharedState, null);
  });

  test("EdgeStateManager updateSharedStateIfChanged updates shared state when when both ecid and collect consent changes", () => {
    jest
      .spyOn(mockIdentityManager, "getECID")
      .mockReturnValueOnce("ECID")
      .mockReturnValueOnce("NEW_ECID")
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null);

    jest
      .spyOn(mockConsentManager, "getCollectConsent")
      .mockReturnValueOnce(ConsentValue.YES)
      .mockReturnValueOnce(ConsentValue.NO)
      .mockReturnValueOnce(ConsentValue.NO)
      .mockReturnValueOnce(null);

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    // previously null ecid and collect consent will be set
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState = {
      "consent.collect": "y",
      ecid: "ECID",
    };

    expect(mockCreateSharedStateFn).toHaveBeenCalledWith(expectedSharedState, null);

    // ecid and collect consent are changed
    edgeStateManager.updateSharedStateIfChanged();

    const expectedSharedState2 = {
      ecid: "NEW_ECID",
      "consent.collect": "n",
    };

    expect(mockCreateSharedStateFn).toHaveBeenNthCalledWith(2, expectedSharedState2, null);

    // ecid is set to null, no change in consent
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState3 = {
      "consent.collect": "n",
    };

    expect(mockCreateSharedStateFn).toHaveBeenNthCalledWith(3, expectedSharedState3, null);

    // ecid is still null, collect consent is null
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState4 = {};
    expect(mockCreateSharedStateFn).toHaveBeenNthCalledWith(4, expectedSharedState4, null);
  });

  test("EdgeStateManager updateSharedStateIfChanged does not update shared state when ecid and collect consent are the same", () => {
    jest.spyOn(mockIdentityManager, "getECID").mockReturnValue("ECID");
    jest.spyOn(mockConsentManager, "getCollectConsent").mockReturnValue(ConsentValue.YES);

    const edgeStateManager = new EdgeStateManager(
      mockCreateSharedStateFn,
      mockIdentityManager,
      mockConsentManager
    );

    // previously null ecid and collect consent will be set
    edgeStateManager.updateSharedStateIfChanged();
    const expectedSharedState = {
      "consent.collect": "y",
      ecid: "ECID",
    };

    // ecid and collect consent are already set
    edgeStateManager.updateSharedStateIfChanged();
    edgeStateManager.updateSharedStateIfChanged();
    edgeStateManager.updateSharedStateIfChanged();

    expect(mockCreateSharedStateFn).toHaveBeenCalledTimes(1); // the first time
    expect(mockCreateSharedStateFn).toHaveBeenCalledWith(expectedSharedState, null);
  });
});
