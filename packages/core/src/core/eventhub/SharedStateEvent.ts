import { Event, EventType, EventSource } from "./";

export function buildSharedStateEvent(extensionName: String, state: Map<string, any>): Event {
  return new Event(
    EventType.HUB,
    EventSource.SHARED_STATE,
    new Map([["stateowner", extensionName]])
  );
}

export function buildPendingSharedStateEvent(
  extensionName: String,
  state: Map<string, any>
): Event {
  return new Event(
    EventType.HUB,
    EventSource.SHARED_STATE,
    new Map([
      ["stateowner", extensionName],
      ["status", "PENDING"],
    ])
  );
}

export function extractSharedState(event: Event): Map<string, any> | null {
  if (event.source === EventSource.SHARED_STATE && event.type === EventType.HUB) {
    return event.data;
  }
  return null;
}
