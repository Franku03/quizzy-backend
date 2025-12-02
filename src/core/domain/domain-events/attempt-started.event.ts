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