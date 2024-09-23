import { uuid } from "../utils/UUID";

export class Event {
  private uui: string = uuid();
  // incrementally increasing id number, "-1" stands for the unprocessed event
  private internalId: number = -1;

  constructor(public type: string, public source: string, public data: Map<string, any> | null) {}

  getUUID(): string {
    return this.uui;
  }

  get id(): number {
    return this.internalId;
  }

  set id(value: number) {
    this.internalId = value;
  }

  // override the default toString method
  toString(): string {
    var data: Map<any, any> = this.data || new Map();
    try {
      var obj = Object.fromEntries(data);
      return `Event: ${this.type} - ${this.source}, data: ${JSON.stringify(obj)}`;
    } catch (e) {
      // console.log(e);
      return `Event: ${this.type} - ${this.source}, data: ${JSON.stringify(data)}`;
    }
  }

  clone(): Event {
    //TODO: implement the clone method
    return this;
  }
}
