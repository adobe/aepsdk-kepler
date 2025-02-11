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

import { DataObject, DataType } from "../core/eventhub/EventData";

export class EdgeHit {
  readonly requestId: string;
  readonly data: DataObject | null = null;
  readonly timestamp: number = Date.now();
  private _meta: DataObject | null = null;
  private _path: string = "";
  private _type: EdgeHitType = EdgeHitType.EDGE;
  private _xdm: DataObject | null = null;

  private _datastreamIdOverride: string | null = null;
  private _datastreamConfigOverride: DataObject | null = null;

  constructor(requestId: string, data: DataObject, timestamp: number) {
    this.requestId = requestId;
    this.data = data;
    this.timestamp = timestamp;
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

  get datastreamIdOverride(): string | null {
    return this._datastreamIdOverride;
  }

  get datastreamConfigOverride(): DataObject | null {
    return this._datastreamConfigOverride;
  }

  private static EdgeHitBuilderInternal = class implements EdgeHitBuilder {
    private edgeHit: EdgeHit;

    constructor(edgeHit: EdgeHit) {
      this.edgeHit = edgeHit;
    }

    setDatastreamIdOverride(datastreamId: string): EdgeHitBuilder {
      this.edgeHit._datastreamIdOverride = datastreamId;
      return this;
    }

    setDatastreamConfigOverride(datastreamConfigOverride: DataObject): EdgeHitBuilder {
      this.edgeHit._datastreamConfigOverride = datastreamConfigOverride;
      return this;
    }

    setMeta(meta: DataObject): EdgeHitBuilder {
      this.edgeHit._meta = meta;
      return this;
    }

    setPath(path: string): EdgeHitBuilder {
      this.edgeHit._path = path;
      return this;
    }

    setType(type: EdgeHitType): EdgeHitBuilder {
      this.edgeHit._type = type;
      return this;
    }

    setXdm(xdm: DataObject): EdgeHitBuilder {
      this.edgeHit._xdm = xdm;
      return this;
    }

    build(): EdgeHit {
      return this.edgeHit;
    }
  };

  static builder(requestId: string, data: DataObject, timestamp: number): EdgeHitBuilder {
    return new EdgeHit.EdgeHitBuilderInternal(new EdgeHit(requestId, data, timestamp));
  }
}

export interface EdgeHitBuilder {
  setDatastreamIdOverride(datastreamId: string): EdgeHitBuilder;
  setDatastreamConfigOverride(datastreamConfigOverride: DataObject): EdgeHitBuilder;
  setMeta(meta: DataObject): EdgeHitBuilder;
  setPath(path: string): EdgeHitBuilder;
  setType(type: EdgeHitType): EdgeHitBuilder;
  setXdm(xdm: DataObject): EdgeHitBuilder;
  build(): EdgeHit;
}

export enum EdgeHitType {
  CONSENT,
  EDGE,
}
