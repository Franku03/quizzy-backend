/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\domain-events\kahoot-assigned.event.ts

import { DomainEvent } from '../abstractions/domain-event';

export class KahootAssignedEvent extends DomainEvent {
    constructor(
        public readonly groupId: string,
        public readonly groupName: string,
        public readonly kahootId: string,
        public readonly kahootTitle: string,
        public readonly assignerName: string,
        public readonly memberIds: string[],
        occurredOn: Date = new Date()
    ) {
        super(KahootAssignedEvent.name, occurredOn);
    }
}
