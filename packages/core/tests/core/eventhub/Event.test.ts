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
import { Event } from "../../../src/core/eventhub";
import { EventData } from "../../../src/core/eventhub";

describe("test Event class", () => {
  beforeEach(() => {});

  afterEach(() => {});

  test("Event.builder() - build an Event", () => {
    const data = EventData.buildFrom({
      key: "value",
    });
    const event = Event.builder("name", "type", "source", data).build();

    expect(event.uuid).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.id).toBe(-1);
    expect(event.name).toBe("name");
    expect(event.type).toBe("type");
    expect(event.source).toBe("source");
    expect(event.data).toEqual(data);
  });

  test("Event.builder() - build an Event with null data", () => {
    const event = Event.builder("name", "type", "source").build();

    expect(event.uuid).toBeDefined();
    expect(event.timestamp).toBeDefined();
    expect(event.id).toBe(-1);
    expect(event.name).toBe("name");
    expect(event.type).toBe("type");
    expect(event.source).toBe("source");
    expect(event.data).toBeNull();
  });

  test("Event.id : id should only be set once", () => {
    const event = Event.builder("name", "type", "source").build();

    expect(event.id).toBe(-1);

    event.id = 1;

    expect(event.id).toBe(1);

    event.id = 2;

    expect(event.id).toBe(1);
  });

  test("Event.toString() - include all properties", () => {
    const data = EventData.buildFrom({
      key: "value",
    });
    const str = Event.builder("event_name", "event_type", "event_source", data).build().toString();
    expect(str).toContain("name: event_name");
    expect(str).toContain('data: {"key":"value"}');
    expect(str).toContain("type: event_type");
    expect(str).toContain("source: event_source");
  });

  test("Event.cloneWithEventData()", async () => {
    const data = EventData.buildFrom({
      key: "value",
    });
    const event = Event.builder("event_name", "event_type", "event_source", data).build();
    const newData = EventData.buildFrom({
      key: "newValue",
    });

    await new Promise((r) => setTimeout(r, 10));

    const clonedEvent = event.cloneWithEventData(newData);
    expect(clonedEvent.data).toEqual(newData);
    expect(clonedEvent.id).toEqual(event.id);
    expect(clonedEvent.name).toEqual(event.name);
    expect(clonedEvent.type).toEqual(event.type);
    expect(clonedEvent.source).toEqual(event.source);

    expect(clonedEvent.uuid).not.toEqual(event.uuid);
    expect(clonedEvent.timestamp).not.toEqual(event.timestamp);
  });

  test("setParentId()", () => {
    const triggerEvent = Event.builder("event_name", "event_type", "event_source").build();

    const responseEvent = Event.builder("event_name", "event_type", "event_source")
      .setParentId(triggerEvent.uuid)
      .build();
    expect(responseEvent.parentId).toEqual(triggerEvent.uuid);
  });

  test("setResponseId()", () => {
    const triggerEvent = Event.builder("event_name", "event_type", "event_source").build();

    const responseEvent = Event.builder("event_name", "event_type", "event_source")
      .setResponseId(triggerEvent.uuid)
      .build();
    expect(responseEvent.responseId).toEqual(triggerEvent.uuid);
  });
});
