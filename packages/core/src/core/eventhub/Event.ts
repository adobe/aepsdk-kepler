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
import { EventData } from "./EventData";
import { LOG_SOURCE } from "../CoreConstants";

const LOG_TAG = "Event";
/**
 * Event class is the basic building block of the EventHub. It is used to represent an event that is being sent or received.
 */
export class Event {
  readonly uuid: string = uuid();

  readonly timestamp: Date = new Date();

  // Note: incrementally increasing id number, "-1" stands for the unprocessed event
  private sequentialId: number = -1;

  readonly type: string;

  readonly source: string;

  readonly name: string;

  readonly data: EventData | null;

  readonly parentId: string = "";

  /**
   * Constructor of the Event class.
   *
   * @param name the name of the event
   * @param type  the type of the event
   * @param source  the source of the event
   * @param data  the data of the event
   */
  constructor(
    name: string,
    type: string,
    source: string,
    data: EventData | null = null,
    parentId: string = ""
  ) {
    this.name = name;
    this.type = type;
    this.source = source;
    this.data = data;
    this.parentId = parentId;
  }

  /**
   * Get the sequential id of the event.
   *
   * @returns the sequential id number
   */
  get id(): number {
    return this.sequentialId;
  }

  /**
   * Set the sequential id of the event. This is used by the EventHub to keep track of the order of the events.
   * The id is set only once, after the event is created.
   *
   * @param value the id number
   */
  set id(value: number) {
    if (this.sequentialId === -1) {
      this.sequentialId = value;
    } else {
      Log.warning(
        LOG_SOURCE,
        LOG_TAG,
        `Failed to set the event id to: ${value}. It has already been set to: ${this.sequentialId}`
      );
    }
  }

  /**
   * Return the event details in a string format.(It's mostly used for debugging)
   *
   * @returns the description string of the event
   */

  toString(): string {
    const tsString = this.timestamp.toTimeString();
    const dataString = this.data?.toString() || "unknown format";
    return `
    [
      id: ${this.sequentialId}
      uuid: ${this.uuid}
      name: ${this.name}
      type: ${this.type}
      source: ${this.source}
      ts: ${tsString}
      data: ${dataString}
      parentId: ${this.parentId}
    ]
    `;
  }

  /**
   * Clone the current Event object with the updated data.
   * The cloned event will have the same id as the original event, but the uuid and timestamp will be different.
   *
   * @returns a clone of the event object
   */
  cloneWithEventData(data: EventData | null = null): Event {
    const newEvent = new Event(this.name, this.type, this.source, data, this.parentId);
    newEvent.id = this.id;
    return newEvent;
  }
}

export const createResponseEvent = function (
  parentEvent: Event,
  eventName: string,
  eventType: string,
  eventSource: string,
  data: EventData
): Event {
  const responseEvent = new Event("Response Event", eventType, eventSource, data, parentEvent.uuid);
  return responseEvent;
};
