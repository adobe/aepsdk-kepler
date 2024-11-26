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

import { DataObject } from "../core/eventhub/EventData";

export class EdgeHit {
  readonly requestId: string = "";
  readonly timestamp: number = Date.now();
  readonly meta: DataObject | null = null;
  readonly path: string = "";
  readonly type: EdgeHitType = EdgeHitType.EDGE;
  readonly xdm: DataObject | null = null;
  readonly data: DataObject | null = null;

  // Public constructor to be called by the builder
  constructor(builder: EdgeHitBuilder) {
    this.requestId = builder.requestId;
    this.timestamp = builder.timestamp;
    this.meta = builder.meta;
    this.path = builder.path;
    this.type = builder.type;
    this.xdm = builder.xdm;
    this.data = builder.data;
  }

  // Static method to initialize the builder
  static builder() {
    return new EdgeHitBuilder();
  }
}

export class EdgeHitBuilder {
  private _requestId: string = "";
  private _timestamp: number = Date.now();
  private _meta: DataObject | null = null;
  private _path: string = "";
  private _type: EdgeHitType = EdgeHitType.EDGE;
  private _xdm: DataObject | null = null;
  private _data: DataObject | null = null;

  get requestId(): string {
    return this._requestId;
  }

  get timestamp(): number {
    return this._timestamp;
  }

  get meta(): DataObject | null {
    return this._meta;
  }

  get path(): string {
    return this._path;
  }

  get type(): EdgeHitType {
    return this._type;
  }

  get xdm(): DataObject | null {
    return this._xdm;
  }

  get data(): DataObject | null {
    return this._data;
  }

  // Method to set requestId
  setRequestId(requestId: string): EdgeHitBuilder {
    this._requestId = requestId;
    return this;
  }

  // Method to set timestamp
  setTimestamp(timestamp: number): EdgeHitBuilder {
    this._timestamp = timestamp;
    return this;
  }

  // Method to set meta
  setMeta(meta: DataObject | null): EdgeHitBuilder {
    this._meta = meta;
    return this;
  }

  // Method to set path
  setPath(path: string): EdgeHitBuilder {
    this._path = path;
    return this;
  }

  // Method to set type
  setType(type: EdgeHitType): EdgeHitBuilder {
    this._type = type;
    return this;
  }

  // Method to set xdm
  setXdm(xdm: DataObject): EdgeHitBuilder {
    this._xdm = xdm;
    return this;
  }

  // Method to set data
  setData(data: DataObject): EdgeHitBuilder {
    this._data = data;
    return this;
  }

  // Method to build the final EdgeHit object
  build(): EdgeHit {
    return new EdgeHit(this);
  }
}

export enum EdgeHitType {
  CONSENT,
  EDGE,
}
