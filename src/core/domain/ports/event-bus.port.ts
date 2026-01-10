/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\ports\event-bus.port.ts

import { DomainEvent } from "src/core/domain/abstractions/domain-event";

// Defines the contract for the event bus system of the domain.

export interface EventBus {
    publish(events: DomainEvent[]): Promise<void>;
    subscribe(eventName: string, callback: (event: DomainEvent) => Promise<void>): void;
}