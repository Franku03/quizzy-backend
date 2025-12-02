import { EventBus } from "src/core/domain/abstractions/event-bus";
import { DomainEvent } from "src/core/domain/abstractions/domain-event";

// An in-memory implementation of the EventBus interface.
// This class allows for the publishing and subscribing of domain events
// within the application's memory space.
// Events are not persisted. 

export class InMemoryEventBus implements EventBus {
    
    // A map to hold event names and their corresponding handlers
    // Each event name can have multiple handlers (listeners)
    // The key is the event name, and the value is an array of callback functions
    // that will be called when the event is published.
    // Each callback function takes a DomainEvent as an argument and returns a Promise<void>.
    // This allows for asynchronous processing of events.

    // The map is initialized as an empty Map.
    // When an event is published, the bus looks up the event name in this map
    // and invokes all registered handlers for that event.
    private handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

    // Subscribe to an event by providing its name and a callback function.
    // The callback will be invoked whenever an event with the specified name is published.
    public subscribe(eventName: string, callback: (event: DomainEvent) => Promise<void>): void {
        // If there are no handlers for this event name yet, initialize an empty array
        if (!this.handlers.has(eventName)) {
            this.handlers.set(eventName, []);
        }
        // Add the provided callback to the list of handlers for this event name
        this.handlers.get(eventName)!.push(callback);
    }

    // Publish an array of domain events.
    // For each event, it looks up the registered handlers and invokes them.
    public async publish(events: DomainEvent[]): Promise<void> {
        for (const event of events) {
            // Get the list of handlers for this event's name
            const handlers = this.handlers.get(event.eventName);
            
            if (handlers) {
                // Execute all listeners for this event
                // We use Promise.all to let them run in parallel
                await Promise.all(handlers.map(handler => handler(event)));
            }
        }
    }
}