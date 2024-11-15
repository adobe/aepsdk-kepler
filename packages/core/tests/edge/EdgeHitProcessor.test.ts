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

import { EdgeHit, EdgeHitType } from '../../src/edge/EdgeHit';
import { EdgeHitProcessor } from '../../src/edge/EdgeHitProcessor';
import { EdgeResponseManager } from '../../src/edge/EdgeResponseManager';
import { ConsentManager, ConsentValue } from '../../src/edge/consent/ConsentManager';
import { DataStore } from '../../src/core/services/DataStore';
import { IdentityManager } from '../../src/edge/identity/IdentityManager';
import { LocationHintManager } from '../../src/edge/LocationHintManager';
import { StateStoreManager } from '../../src/edge/StateStoreManager';
import { asyncRequest } from '../../src/core/utils/networking';

jest.mock('../../src/core/utils/networking');
jest.mock('../../src/core/services/DataStore');
jest.mock('../../src/edge/identity/IdentityManager');
jest.mock('../../src/edge/consent/ConsentManager');
jest.mock('../../src/edge/LocationHintManager');
jest.mock('../../src/edge/StateStoreManager');

describe('EdgeHitProcessor tests', () => {
    let mockAsyncRequest: jest.MockedFunction<typeof asyncRequest>;
    let mockDataStore: jest.Mocked<DataStore>;
    let mockConsentManager: jest.Mocked<ConsentManager>;
    let mockIdentityManager: jest.Mocked<IdentityManager>;
    let mockLocationHintManager: jest.Mocked<LocationHintManager>;
    let mockStateStoreManager: jest.Mocked<StateStoreManager>;
    const mockDispatchFn: jest.Mock = jest.fn();


    beforeEach(() => {
        mockAsyncRequest = asyncRequest as jest.MockedFunction<typeof asyncRequest>;

        mockDataStore = {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
        } as jest.Mocked<DataStore>;


        mockConsentManager = new ConsentManager(mockDataStore, mockDispatchFn) as jest.Mocked<ConsentManager>;
        jest.spyOn(mockConsentManager, 'getCollectConsent').mockReturnValue(ConsentValue.YES);

        mockIdentityManager = new IdentityManager(mockDataStore, mockDispatchFn) as jest.Mocked<IdentityManager>;
        jest.spyOn(mockIdentityManager, 'getIdentityMap').mockReturnValue(null);

        mockLocationHintManager = new LocationHintManager(mockDataStore) as jest.Mocked<LocationHintManager>;

        mockStateStoreManager = new StateStoreManager(mockDataStore) as jest.Mocked<StateStoreManager>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('EdgeHitProcessor should be defined', () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);
        expect(edgeHitProcessor).toBeDefined();
    });

    test('process should do nothing when queue is empty', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        await edgeHitProcessor.process();
    });

    test('should queue edge and consent hits correctly', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const edgeHit = EdgeHit.builder().setType(EdgeHitType.EDGE).build();
        const consentHit = EdgeHit.builder().setType(EdgeHitType.CONSENT).build();

        edgeHitProcessor.queueHit(edgeHit);
        edgeHitProcessor.queueHit(consentHit);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(1);
    });

    test('process should send edge hit to edge network and remove it from queue', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
          });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);


        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/interact?configId');
        expect(actualBody).toEqual(
           "{\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}},\"events\":[{\"xdm\":{\"key\":\"value\"},\"data\":{\"key\":\"value\"},\"timestamp\":"+ testTS +"}],\"query\":{\"identity\":{\"fetch\":[\"ECID\"]}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send all the queued hits', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        const testTS2 = Date.now();
        const edgeHit2 = EdgeHit.builder()
            .setRequestId("requestId2")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS2})
            .setTimestamp(testTS2)
            .build();

        edgeHitProcessor.queueHit(edgeHit2);

        const testTS3 = Date.now();
        const edgeHit3 = EdgeHit.builder()
            .setRequestId("requestId3")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS3})
            .setTimestamp(testTS3)
            .build();

        edgeHitProcessor.queueHit(edgeHit3);

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(3);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(3);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(3);
    });

    test('process should send consent hit to edge network and remove it from queue', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const consentHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'y',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual(
            "{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"y\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"},\"identity\":{\"fetch\":[\"ECID\"]}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should not send edge hit and drop edge hit to edge network, but should send consent hit when consent is n', async () => {
        jest.spyOn(mockConsentManager, 'getCollectConsent').mockReturnValue(ConsentValue.NO);

        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("edgeRequestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        const consentHit = EdgeHit.builder()
            .setRequestId("consentRequestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'n',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(2); // 1 for edge hit and 1 for consent hit

        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual(
            "{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"n\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"},\"identity\":{\"fetch\":[\"ECID\"]}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should not send edge hit but should send consent hit to edge network when consent is p', async () => {
        jest.spyOn(mockConsentManager, 'getCollectConsent').mockReturnValue(ConsentValue.PENDING);

        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("edgeRequestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        const consentHit = EdgeHit.builder()
            .setRequestId("consentRequestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'y',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(2); // 1 for edge hit and 1 for consent hit

        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(1);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual(
            "{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"y\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"},\"identity\":{\"fetch\":[\"ECID\"]}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('test queueHit when max queue size is reached', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        jest.spyOn(edgeHitProcessor, 'queueHit');

        for (let i = 0; i < 100; i++) {
            const edgeHit = EdgeHit.builder()
            .setRequestId(`requestId${i+1}`)
            .build();
            edgeHitProcessor.queueHit(edgeHit);
        }

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(100);

        const edgeHit101 = EdgeHit.builder()
            .setRequestId(`requestId101`)
            .build();
        edgeHitProcessor.queueHit(edgeHit101);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(100);
        expect(edgeHitProcessor.queueHit).toHaveBeenCalledTimes(101);
        expect(edgeHitProcessor.queueHit).toHaveBeenLastCalledWith(edgeHit101);
    });

    test('test queueHit when max queue size is reached for consent queue', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        jest.spyOn(edgeHitProcessor, 'queueHit');

        for (let i = 0; i < 100; i++) {
            const consentHit = EdgeHit.builder()
            .setRequestId(`requestId${i+1}`)
            .setType(EdgeHitType.CONSENT)
            .build();
            edgeHitProcessor.queueHit(consentHit);
        }

        expect(edgeHitProcessor.getConsentQueueSize()).toBe(100);

        const consentHit101 = EdgeHit.builder()
            .setRequestId(`requestId101`)
            .setType(EdgeHitType.CONSENT)
            .build();
        edgeHitProcessor.queueHit(consentHit101);

        expect(edgeHitProcessor.getConsentQueueSize()).toBe(100);
        expect(edgeHitProcessor.queueHit).toHaveBeenCalledTimes(101);
        expect(edgeHitProcessor.queueHit).toHaveBeenLastCalledWith(consentHit101);
    });

    test('process should send edge hit with location hint when location hint is present', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        mockLocationHintManager.getLocationHint.mockReturnValue('mockLocationHint');

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockLocationHintManager.getLocationHint).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/mockLocationHint/v1/interact?configId');
        expect(actualBody).toEqual(
            "{\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}},\"events\":[{\"xdm\":{\"key\":\"value\"},\"data\":{\"key\":\"value\"},\"timestamp\":"+ testTS +"}],\"query\":{\"identity\":{\"fetch\":[\"ECID\"]}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send consent hit with location hint when location hint is present', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const consentHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'y',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockLocationHintManager.getLocationHint.mockReturnValue('mockLocationHint');

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockLocationHintManager.getLocationHint).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/mockLocationHint/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual("{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"y\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"},\"identity\":{\"fetch\":[\"ECID\"]}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send edge hit with identity map when identity map is present and not add fetch ecid query', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        mockIdentityManager.getIdentityMap.mockReturnValue(
            {
                "ECID": [
                    {
                        "authenticatedState": "ambiguous",
                        "id": "mockECID",
                        "primary": true
                    }
                ]
            }
        );

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/interact?configId');
        expect(actualBody).toEqual(
            "{\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"},\"identityMap\":{\"ECID\":[{\"authenticatedState\":\"ambiguous\",\"id\":\"mockECID\",\"primary\":true}]}},\"events\":[{\"xdm\":{\"key\":\"value\"},\"data\":{\"key\":\"value\"},\"timestamp\":"+ testTS +"}]}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send consent hit with identity map when identity map is present and not add fetch ecid query', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const consentHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'y',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockIdentityManager.getIdentityMap.mockReturnValue(
            {
                "ECID": [
                    {
                        "authenticatedState": "ambiguous",
                        "id": "mockECID",
                        "primary": true
                    }
                ]
            }
        );

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockIdentityManager.getIdentityMap).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual("{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"y\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"},\"identityMap\":{\"ECID\":[{\"authenticatedState\":\"ambiguous\",\"id\":\"mockECID\",\"primary\":true}]}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send edge hit with state store when state store is present', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const edgeHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({"xdm": { "key": "value"}, "data": { "key": "value"}, timestamp: testTS})
            .setTimestamp(testTS)
            .build();

        edgeHitProcessor.queueHit(edgeHit);

        mockStateStoreManager.getStateStore.mockReturnValue(
            [
                {
                    key: "kndctr_1234_AdobeOrg_cluster",
                    value: "or2",
                    maxAge: 1800
                },
                {
                    key: "kndctr_1234_AdobeOrg_identity",
                    value: "123456789abcdef",
                    maxAge: 1800
                }
            ]
        );

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockStateStoreManager.getStateStore).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/interact?configId');
        expect(actualBody).toEqual(
            "{\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}},\"events\":[{\"xdm\":{\"key\":\"value\"},\"data\":{\"key\":\"value\"},\"timestamp\":"+ testTS +"}],\"query\":{\"identity\":{\"fetch\":[\"ECID\"]}},\"meta\":{\"state\":{\"entries\":[{\"key\":\"kndctr_1234_AdobeOrg_cluster\",\"value\":\"or2\",\"maxAge\":1800},{\"key\":\"kndctr_1234_AdobeOrg_identity\",\"value\":\"123456789abcdef\",\"maxAge\":1800}]}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });

    test('process should send consent hit with state store when state store is present', async () => {
        const responseManager = new EdgeResponseManager(mockDispatchFn, mockIdentityManager, mockConsentManager, mockLocationHintManager, mockStateStoreManager);
        const edgeHitProcessor = new EdgeHitProcessor( responseManager, mockConsentManager, mockIdentityManager, mockLocationHintManager, mockStateStoreManager);

        const testTS = Date.now();
        const consentHit = EdgeHit.builder()
            .setRequestId("requestId1")
            .setData({
                "consent": [
                    {
                        "standard": "Adobe",
                        "version": "2.0",
                        "value": {
                            "collect": {
                                "val": 'y',
                            },
                            "metadata": {
                              "time": testTS,
                            }
                        }
                    }
                ]
            })
            .setTimestamp(testTS)
            .setType(EdgeHitType.CONSENT)
            .build();

        edgeHitProcessor.queueHit(consentHit);

        mockStateStoreManager.getStateStore.mockReturnValue(
            [
                {
                    key: "kndctr_1234_AdobeOrg_cluster",
                    value: "or2",
                    maxAge: 1800
                },
                {
                    key: "kndctr_1234_AdobeOrg_identity",
                    value: "123456789abcdef",
                    maxAge: 1800
                }
            ]
        );

        mockAsyncRequest.mockResolvedValue({
            responseCode: 200,
            bodyAsText: '{}',
        });

        const success = await edgeHitProcessor.process();
        expect(success).toBe(true);

        expect(mockConsentManager.getCollectConsent).toHaveBeenCalledTimes(1);
        expect(mockStateStoreManager.getStateStore).toHaveBeenCalledTimes(1);
        expect(mockAsyncRequest).toHaveBeenCalledTimes(1);

        expect(edgeHitProcessor.getEdgeQueueSize()).toBe(0);
        expect(edgeHitProcessor.getConsentQueueSize()).toBe(0);

        const actualUrl = mockAsyncRequest.mock.calls[0][0]['url'] as string;
        const actualBody = mockAsyncRequest.mock.calls[0][0]['body'] as string;
        const actualMethod = mockAsyncRequest.mock.calls[0][0]['method'] as string;
        const actualTimeout = mockAsyncRequest.mock.calls[0][0]['timeout'] as number;

        expect(actualUrl).toContain('https://edge.adobedc.net/ee/v1/privacy/set-consent?configId');
        expect(actualBody).toEqual("{\"consent\":[{\"standard\":\"Adobe\",\"version\":\"2.0\",\"value\":{\"collect\":{\"val\":\"y\"},\"metadata\":{\"time\":" + testTS + "}}}],\"query\":{\"consent\":{\"operation\":\"update\"},\"identity\":{\"fetch\":[\"ECID\"]}},\"xdm\":{\"implementationDetails\":{\"name\":\"https://ns.adobe.com/experience/mobilesdk/kepler\",\"version\":\"1.0.0\",\"environment\":\"app\"}},\"meta\":{\"state\":{\"entries\":[{\"key\":\"kndctr_1234_AdobeOrg_cluster\",\"value\":\"or2\",\"maxAge\":1800},{\"key\":\"kndctr_1234_AdobeOrg_identity\",\"value\":\"123456789abcdef\",\"maxAge\":1800}]}}}"
        );
        expect(actualMethod).toEqual("POST");
        expect(actualTimeout).toEqual(5000);
    });
});
