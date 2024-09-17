import { Event } from ".";

export type EventListener = (event: Event) => void;

export type EventProcessor = (event: Event) => Event;

export interface EventHub {

    /**
     * The version of the event hub
     */
    version: string;

    /**
     * Listen an event
     * 
     * @param eventType    The type of event
     * @param EventSource  The source of the event
     * @param listener     The listener to be called when the event is emitted
     * @returns            The id of the listener
     */
    on(eventType: string, EventSource: string, listener: EventListener): string;

    /**
     * Emit an event
     * 
     * @param event  The event to be emitted
     * 
     */
    dispatchEvent(event: Event): void;

    /**
     * Emit an event and await the related response event.
     * 
     * @param event  The event to be emitted
     * @returns      The response event
     */
    dispatchEventWithResponseHandling(event: Event): Promise<Event>;

    /**
     * Start the event hub.
     */
    start(): void;

    /** 
     * Register an event processor. All events will be processed by the processor before sending to the listeners.
    */
    registerEventProcessor(processor: EventProcessor): void;

    // TODO: Think about adding more methods to the interface, such as unregisterListener(), Stop(), Shutdown(), etc.

}