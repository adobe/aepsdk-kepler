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

describe('EdgeHit tests', () => {

    test('EdgeHit builder type edge', () => {
        const builder = EdgeHit.builder();
        builder.requestId = "requestId";
        builder.timestamp = new Date();
        builder.meta = new Map<string, any>();
        builder.path = "custom/path/here";
        builder.type = EdgeHitType.EDGE;
        builder.data = new Map([["key", "value"]]);

        const edgeHit = builder.build();

        expect(edgeHit.requestId).toBe("requestId");
        expect(edgeHit.timestamp).toBeInstanceOf(Date);
        expect(edgeHit.meta).toBeInstanceOf(Map);
        expect(edgeHit.path).toBe("custom/path/here");
        expect(edgeHit.type).toBe(EdgeHitType.EDGE);
        expect(edgeHit.data).toBeInstanceOf(Map);
        expect(edgeHit.data?.size).toBe(1);
        expect(edgeHit.data?.get("key")).toBe("value");
    });

    test('EdgeHit builder type consent', () => {
        const builder = EdgeHit.builder();
        builder.requestId = "requestId";
        builder.timestamp = new Date();
        builder.meta = new Map<string, any>();
        builder.path = "custom/path/here";
        builder.type = EdgeHitType.CONSENT;
        builder.data = new Map([["key", "value"]]);

        const edgeHit = builder.build();

        expect(edgeHit.requestId).toBe("requestId");
        expect(edgeHit.timestamp).toBeInstanceOf(Date);
        expect(edgeHit.meta).toBeInstanceOf(Map);
        expect(edgeHit.path).toBe("custom/path/here");
        expect(edgeHit.type).toBe(EdgeHitType.CONSENT);
        expect(edgeHit.data).toBeInstanceOf(Map);
        expect(edgeHit.data?.size).toBe(1);
        expect(edgeHit.data?.get("key")).toBe("value");
    });

    test('EdgeHit builder null event data', () => {
        const builder = EdgeHit.builder();
        builder.requestId = "requestId";
        builder.timestamp = new Date();
        builder.meta = new Map<string, any>();
        builder.path = "custom/path/here";
        builder.type = EdgeHitType.EDGE;
        builder.data = null;

        const edgeHit = builder.build();

        expect(edgeHit.requestId).toBe("requestId");
        expect(edgeHit.timestamp).toBeInstanceOf(Date);
        expect(edgeHit.meta).toBeInstanceOf(Map);
        expect(edgeHit.path).toBe("custom/path/here");
        expect(edgeHit.type).toBe(EdgeHitType.EDGE);
        expect(edgeHit.data).toBeNull();
    });

    test('EdgeHit builder no fields set', () => {
        const builder = EdgeHit.builder();
        const edgeHit = builder.build();

        expect(edgeHit.requestId).toBe("");
        expect(edgeHit.timestamp).toBeInstanceOf(Date);
        expect(edgeHit.meta).toBeNull();
        expect(edgeHit.path).toBe("");
        expect(edgeHit.type).toBe(EdgeHitType.EDGE);
        expect(edgeHit.data).toBeNull();
    });


});
