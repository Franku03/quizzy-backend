// IMPORT PATH: import { DomainEvent } from "src/core/domain/abstractions/domain-event";

// This abstract class serves as the blueprint for all domain events within the system.
// Domain events represent significant occurrences or changes in state 
// that are relevant to the business domain.
// By extending this class, specific events can encapsulate additional data and behavior 
// pertinent to those events.

export abstract class DomainEvent {
    public readonly occurredOn: Date;
    public readonly eventName: string;

    protected constructor(eventName: string, occurredOn: Date = new Date()) {
        this.eventName = eventName;
        this.occurredOn = occurredOn;
    }
}