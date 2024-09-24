import { Log } from "../utils/Log";
import { EventHub, EventListener, EventProcessor, Event } from ".";

export class EventhubImpl implements EventHub {
  version = "1.0.0";

  private isStarted: boolean = false;
  private listeners: Map<string, EventListener[]> = new Map();
  private eventQueue: Event[] = [];
  private processoers: EventProcessor[] = [];
  private currentEventId: number = 1;

  start(): void {
    this.eventQueue.forEach((event) => this.dispatchEvent(event));
    this.isStarted = true;
    this.eventQueue = [];
  }

  registerEventProcessor(processor: EventProcessor): void {
    this.processoers.push(processor);
  }

  on(eventType: string, EventSource: string, listener: EventListener): string {
    let listenerKey = this.generateListenerKey(eventType, EventSource);
    this.listeners.get(listenerKey)?.push(listener) ?? this.listeners.set(listenerKey, [listener]);

    // TODO: return the id of the listener that can be used to remove the listener later
    return "xxxxx";
  }

  dispatchEvent(event: Event): void {
    // assign an incrementatl id to the event
    event.id = this.currentEventId++;

    if (!this.isStarted) {
      this.eventQueue.push(event);
      return;
    }

    let clonedEvent = event.clone();
    Log.debug(`Event dispatched: ${clonedEvent}`);
    let processedEvent = this.processEvent(clonedEvent);
    // Log.debug(`Event processed: ${processedEvent}`);

    let listenerKey = this.generateListenerKey(processedEvent.type, processedEvent.source);
    this.listeners.get(listenerKey)?.forEach((listener) => listener(processedEvent));
    return;
  }

  async dispatchEventWithResponseHandling(event: Event): Promise<Event> {
    // TODOS: Implement this method if needed.
    return new Promise((resolve, reject) => {
      resolve(event);
    });
  }

  private processEvent(event: Event): Event {
    this.processoers.forEach((processor) => (event = processor(event)));
    return event;
  }

  /**
   * Generate a key for the listener
   *
   * @param eventType the type of the event
   * @param eventSource the source of the event
   * @returns the key for the listener in the format of "eventType:eventSource"
   */
  private generateListenerKey(eventType: string, eventSource: string): string {
    return `${eventType}:${eventSource}`;
  }
}
