// IMPORT ROUTE: import { EventBus } from "src/core/domain/abstractions/event-bus";

import { DomainEvent } from "src/core/domain/abstractions/domain-event";

// Defines the contract for the event bus system of the domain.

export interface EventBus {
    publish(events: DomainEvent[]): Promise<void>;
    subscribe(eventName: string, callback: (event: DomainEvent) => Promise<void>): void;
}