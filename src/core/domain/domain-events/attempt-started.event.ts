/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\domain-events\attempt-started.event.ts

import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { AttemptId } from "../shared-value-objects/id-objects/singleplayer-attempt.id";
import { KahootId } from "../shared-value-objects/id-objects/kahoot.id";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

// This event signifies the start of a SoloAttempt by a player.
// It captures essential identifiers related to the attempt,
// allowing other system components to react accordingly. 
export class SoloAttemptStartedEvent extends DomainEvent {
    
    constructor(
        public readonly attemptId: AttemptId,
        public readonly playerId: PlayerId,
        public readonly kahootId: KahootId,
    ) {
        super(SoloAttemptStartedEvent.name);
    }
}