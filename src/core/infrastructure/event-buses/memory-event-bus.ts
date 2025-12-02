import { EventBus } from "src/core/domain/ports/event-bus.port";
import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { Injectable } from "@nestjs/common";

// An in-memory implementation of the EventBus interface.
// This class allows for the publishing and subscribing of domain events
// within the application's memory space.
// Events are not persisted. 

@Injectable()
export class InMemoryEventBus implements EventBus {
    
    // Hanlders is a map where the keys are event names (strings)
    // and the values are arrays of callback functions that handle those events.

    // When the class is instantiated, the handlers map is initialized empty.
    // Handlers will be added to this map when subscribe() is called by other parts of the application.
    // These are the event listeners. 
    
    // When a listener subscribes to an event, it provides 
    // a personal callback function that will be called when that event is published.
    // The map structure allows multiple listeners to be registered for the same event name.
    // That's why we have an array of callbacks for each event name. Each listener gets 
    // its own callback in that array.

    // When an event is published, the bus looks up the event name in this map
    // and invokes all registered handlers's callbacks for that event. 
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