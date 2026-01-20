/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\abstractions\domain-event.ts

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
