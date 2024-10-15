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
import { uuid } from "../utils/uuid";
import { Log } from "../utils/Log";

const LOG_TAG = "Event";
const LOG_EXTENSION = "Core";
/**
 * Event class is the basic building block of the EventHub. It is used to represent an event that is being sent or received.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export class Event {
  private _uuid: string = uuid();

  private _timestamp: Date = new Date();

  // Note: incrementally increasing id number, "-1" stands for the unprocessed event
  private _sequentialId: number = -1;

  private _type: string = "";

  private _source: string = "";

  private _name: string = "";

  private _data: Map<string, any> | null = null;

  /**
   * Constructor of the Event class.
   *
   * @param name the name of the event
   * @param type  the type of the event
   * @param source  the source of the event
   * @param data  the data of the event
   */
  constructor(name: string, type: string, source: string, data: Map<string, any> | null = null) {
    this._name = name;
    this._type = type;
    this._source = source;
    if (data) {
      this._data = _cloneEventData(data);
    }
  }

  /**
   * Get the UUID of the event.
   *
   * @returns the string of the UUID
   */
  get uuid(): string {
    return this._uuid;
  }

  /**
   * Get the sequential id of the event.
   *
   * @returns the sequential id number
   */
  get id(): number {
    return this._sequentialId;
  }

  /**
   * Set the sequential id of the event. This is used by the EventHub to keep track of the order of the events.
   * The id is set only once, after the event is created.
   *
   * @param value the id number
   */
  set id(value: number) {
    if (this._sequentialId === -1) this._sequentialId = value;
  }

  /**
   * Get the type of the event.
   *
   * @returns the type string
   */
  get type(): string {
    return this._type;
  }

  /**
   * Get the source of the event.
   *
   * @returns the source string
   */
  get source(): string {
    return this._source;
  }

  /**
   * Get the name of the event.
   *
   * @returns the name string
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get the data map of the event.
   */
  get data(): Map<string, any> | null {
    return this._data;
  }

  /**
   * Get the timestamp of the event.
   *
   * @returns an Date object
   */
  get timestamp(): Date {
    return this._timestamp;
  }

  /**
   * Return the event details in a string format.(It's mostly used for debugging)
   *
   * @returns the description string of the event
   */

  toString(): string {
    const data: Map<any, any> = this._data || new Map();
    const tsString = this._timestamp.toTimeString();
    let dataString = "unknown format";
    try {
      dataString = JSON.stringify(Array.from(data.entries()));
    } catch (e) {
      Log.error(LOG_EXTENSION, LOG_TAG, `Event.toString() failed to stringify data. Error: ${e}`);
    }

    return `
    [
      id: ${this._sequentialId}
      uuid: ${this._uuid}
      name: ${this._name}
      type: ${this._type}
      source: ${this._source}
      ts: ${tsString}
      data: ${dataString}
    ]
    `;
  }

  /**
   * Clone the current Event object with updated data
   *
   * @returns a clone of the event object
   */
  cloneWithEventData(data: Map<string, any> | null = null): Event {
    const clonedData = data ? _cloneEventData(data) : null;
    const newEvent = new Event(this._name, this._type, this._source, clonedData);
    newEvent.id = this.id;
    return newEvent;
  }
}

/**
 * Clone the event data map
 *
 * @param data  the data map to be cloned
 * @returns  the cloned data map
 */
export function _cloneEventData(data: Map<string, any>): Map<string, any> {
  const newData = new Map<string, any>();
  data.forEach((value, key) => {
    const deepCopy = JSON.parse(JSON.stringify(value));
    newData.set(key, deepCopy);
  });
  return newData;
}
