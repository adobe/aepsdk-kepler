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

import { EdgeResponseManager } from "../../src/edge/EdgeResponseManager";
import { DataStore } from "../../src/core/services/DataStore";
import { IdentityManager } from "../../src/edge/identity/IdentityManager";
import { LocationHintManager } from "../../src/edge/LocationHintManager";
import { StateStoreManager } from "../../src/edge/StateStoreManager";
import { ConsentManager, ConsentValue } from "../../src/edge/consent/ConsentManager";
import { EventData } from "../../src/core/eventhub";

jest.mock("../../src/core/services/DataStore");
jest.mock("../../src/edge/identity/IdentityManager");
jest.mock("../../src/edge/consent/ConsentManager");
jest.mock("../../src/edge/LocationHintManager");
jest.mock("../../src/edge/StateStoreManager");

describe("EdgeResponseManager tests", () => {
  let mockDataStore: jest.Mocked<DataStore>;
  let mockConsentManager: jest.Mocked<ConsentManager>;
  let mockIdentityManager: jest.Mocked<IdentityManager>;
  let mockLocationHintManager: jest.Mocked<LocationHintManager>;
  let mockStateStoreManager: jest.Mocked<StateStoreManager>;

  const mockDispatchFn = jest.fn();

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

    mockLocationHintManager = new LocationHintManager(
      mockDataStore
    ) as jest.Mocked<LocationHintManager>;
    jest.spyOn(mockLocationHintManager, "getLocationHint").mockReturnValue(null);

    mockStateStoreManager = new StateStoreManager(mockDataStore) as jest.Mocked<StateStoreManager>;
    jest.spyOn(mockStateStoreManager, "getStateStore").mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("EdgeResponseManager should be defined", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    expect(edgeResponseManager).toBeDefined();
  });

  test("EdgeResponseManager handleEdgeResponse with identity handle calls identity processEdgeRespons with correct handle data and the response event is dispatched", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    edgeResponseManager.handleEdgeResponse({
      handle: [
        {
          type: "identity:result",
          payload: [
            {
              namespace: {
                code: "ECID",
              },
              id: "test-ecid",
            },
          ],
        },
      ],
    });

    expect(mockIdentityManager.processEdgeResponse).toHaveBeenCalledTimes(1);
    expect(mockIdentityManager.processEdgeResponse).toBeCalledWith({
      type: "identity:result",
      payload: [
        {
          namespace: {
            code: "ECID",
          },
          id: "test-ecid",
        },
      ],
    });
    expect(mockConsentManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockLocationHintManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockStateStoreManager.processEdgeResponse).not.toHaveBeenCalled();

    const expectedEventData = EventData.buildFrom({
      type: "identity:result",
      payload: [
        {
          namespace: {
            code: "ECID",
          },
          id: "test-ecid",
        },
      ],
    });

    expect(mockDispatchFn).toBeCalledWith({
      name: "AEP Response Event Handle",
      type: "com.adobe.eventType.edge",
      source: "identity:result",
      data: expectedEventData,
      sequentialId: expect.any(Number),
      timestamp: expect.any(Date),
      uuid: expect.any(String),
    });
  });

  test("EdgeResponseManager handleEdgeResponse with consent handle calls consent processEdgeRespons with correct handle data and the response event is dispatched", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    edgeResponseManager.handleEdgeResponse({
      handle: [
        {
          type: "consent:preferences",
          payload: [
            {
              collect: {
                val: "y",
              },
            },
          ],
        },
      ],
    });

    expect(mockConsentManager.processEdgeResponse).toHaveBeenCalledTimes(1);
    expect(mockConsentManager.processEdgeResponse).toBeCalledWith({
      type: "consent:preferences",
      payload: [
        {
          collect: {
            val: "y",
          },
        },
      ],
    });

    const expectedEventData = EventData.buildFrom({
      type: "consent:preferences",
      payload: [
        {
          collect: {
            val: "y",
          },
        },
      ],
    });
    expect(mockIdentityManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockLocationHintManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockStateStoreManager.processEdgeResponse).not.toHaveBeenCalled();

    expect(mockDispatchFn).toBeCalledWith({
      name: "AEP Response Event Handle",
      type: "com.adobe.eventType.edge",
      source: "consent:preferences",
      data: expectedEventData,
      sequentialId: expect.any(Number),
      timestamp: expect.any(Date),
      uuid: expect.any(String),
    });
  });

  test("EdgeResponseManager handleEdgeResponse with location hint handle calls location hint processEdgeRespons with correct handle data and the response event is dispatched", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    edgeResponseManager.handleEdgeResponse({
      handle: [
        {
          type: "locationHint:result",
          payload: [
            {
              scope: "EdgeNetwork",
              hint: "test-location-hint",
              ttlSeconds: 1800,
            },
          ],
        },
      ],
    });

    expect(mockLocationHintManager.processEdgeResponse).toHaveBeenCalledTimes(1);
    expect(mockLocationHintManager.processEdgeResponse).toBeCalledWith({
      type: "locationHint:result",
      payload: [
        {
          scope: "EdgeNetwork",
          hint: "test-location-hint",
          ttlSeconds: 1800,
        },
      ],
    });

    const expectedEventData = EventData.buildFrom({
      type: "locationHint:result",
      payload: [
        {
          scope: "EdgeNetwork",
          hint: "test-location-hint",
          ttlSeconds: 1800,
        },
      ],
    });
    expect(mockIdentityManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockConsentManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockStateStoreManager.processEdgeResponse).not.toHaveBeenCalled();

    expect(mockDispatchFn).toBeCalledWith({
      name: "AEP Response Event Handle",
      type: "com.adobe.eventType.edge",
      source: "locationHint:result",
      data: expectedEventData,
      sequentialId: expect.any(Number),
      timestamp: expect.any(Date),
      uuid: expect.any(String),
    });
  });

  test("EdgeResponseManager handleEdgeResponse with state store handle calls state store processEdgeRespons with correct handle data and the response event is dispatched", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    edgeResponseManager.handleEdgeResponse({
      handle: [
        {
          type: "state:store",
          payload: [
            {
              key: "kndctr_1234_AdobeOrg_cluster",
              value: "or2",
              maxAge: 1800,
            },
          ],
        },
      ],
    });

    expect(mockStateStoreManager.processEdgeResponse).toHaveBeenCalledTimes(1);
    expect(mockStateStoreManager.processEdgeResponse).toBeCalledWith({
      type: "state:store",
      payload: [
        {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          maxAge: 1800,
        },
      ],
    });

    const expectedEventData = EventData.buildFrom({
      type: "state:store",
      payload: [
        {
          key: "kndctr_1234_AdobeOrg_cluster",
          value: "or2",
          maxAge: 1800,
        },
      ],
    });
    expect(mockIdentityManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockConsentManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockLocationHintManager.processEdgeResponse).not.toHaveBeenCalled();

    expect(mockDispatchFn).toBeCalledWith({
      name: "AEP Response Event Handle",
      type: "com.adobe.eventType.edge",
      source: "state:store",
      data: expectedEventData,
      sequentialId: expect.any(Number),
      timestamp: expect.any(Date),
      uuid: expect.any(String),
    });
  });

  test("EdgeResponseManager handleEdgeResponse with other handle types dispatches events", () => {
    const edgeResponseManager = new EdgeResponseManager(
      mockDispatchFn,
      mockIdentityManager,
      mockConsentManager,
      mockLocationHintManager,
      mockStateStoreManager
    );
    edgeResponseManager.handleEdgeResponse({
      handle: [
        {
          type: "media-analytics:new-session",
          payload: [
            {
              sessionId: "test-backend-session-id",
            },
          ],
        },
      ],
    });

    expect(mockIdentityManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockConsentManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockLocationHintManager.processEdgeResponse).not.toHaveBeenCalled();
    expect(mockStateStoreManager.processEdgeResponse).not.toHaveBeenCalled();

    const expectedEventData = EventData.buildFrom({
      type: "media-analytics:new-session",
      payload: [
        {
          sessionId: "test-backend-session-id",
        },
      ],
    });

    expect(mockDispatchFn).toBeCalledWith({
      name: "AEP Response Event Handle",
      type: "com.adobe.eventType.edge",
      source: "media-analytics:new-session",
      data: expectedEventData,
      sequentialId: expect.any(Number),
      timestamp: expect.any(Date),
      uuid: expect.any(String),
    });
  });
});
