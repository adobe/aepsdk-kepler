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

import { getAsMap } from "../core/utils/MapUtil";

export class EdgeHit {

    private _requestId: string = "";
    private _timestamp: Date = new Date();
    private _meta: Map<string, any> | null = null;
    private _path: string = "";
    private _type: EdgeHitType = EdgeHitType.EDGE;
    private _data: Map<string, any> | null = null;

    // Public constructor to be called by the builder
    constructor(builder: EdgeHitBuilder) {
        this._requestId = builder.requestId;
        this._timestamp = builder.timestamp;
        this._meta = builder.meta;
        this._path = builder.path;
        this._type = builder.type;
        this._data = builder.data;
    }

    // Static method to initialize the builder
    static builder() {
        return new EdgeHitBuilder();
    }

    // Getter for requestId
    get requestId(): string {
        return this._requestId;
    }

    // Getter for timestamp
    get timestamp(): Date {
        return this._timestamp;
    }

    // Getter for meta
    get meta(): Map<string, any> | null {
        return this._meta;
    }

    // Getter for path
    get path(): string {
        return this._path;
    }

    // Getter for type
    get type(): EdgeHitType {
        return this._type;
    }

    // Getter for data
    get data(): Map<string, any> | null {
        return this._data;
    }

}

export class EdgeHitBuilder {
    requestId: string = "";
    timestamp: Date = new Date();
    meta: Map<string, any> | null = null;
    path: string = "";
    type: EdgeHitType = EdgeHitType.EDGE;
    source: string = "";
    data: Map<string, any> | null = null;

    // Method to set requestId
    setRequestId(requestId: string): EdgeHitBuilder {
        this.requestId = requestId;
        return this;
    }

    // Method to set timestamp
    setTimestamp(timestamp: Date): EdgeHitBuilder {
        this.timestamp = timestamp;
        return this;
    }

    // Method to set meta
    setMeta(meta: Map<string, any> | null): EdgeHitBuilder {
        this.meta = meta;
        return this;
    }

    // Method to set path
    setPath(path: string): EdgeHitBuilder {
        this.path = path;
        return this;
    }

    // Method to set type
    setType(type: EdgeHitType): EdgeHitBuilder {
        this.type = type;
        return this;
    }

    // Method to set source
    setSource(source: string): EdgeHitBuilder {
        this.source = source;
        return this;
    }

    // Method to set data
    setData(data: Map<string, any>): EdgeHitBuilder {
        this.data = getAsMap(data);
        return this;
    }

    // Method to build the final EdgeHit object
    build(): EdgeHit {
        return new EdgeHit(this);
    }
}


export enum EdgeHitType {
    CONSENT,
    EDGE
}
