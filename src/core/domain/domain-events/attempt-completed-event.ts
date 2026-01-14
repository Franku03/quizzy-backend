/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\domain-events\attempt-completed-event.ts

import { DomainEvent } from 'src/core/domain/abstractions/domain-event';
import { Score } from '../shared-value-objects/value-objects/value.object.score';
import { AttemptId } from '../shared-value-objects/id-objects/singleplayer-attempt.id';
import { KahootId } from '../shared-value-objects/id-objects/kahoot.id';
import { PlayerId } from 'src/multiplayer-sessions/domain/value-objects';

// This event signifies the completion of a SoloAttempt by a player.
// It captures essential details about the attempt's outcome,
// including identifiers and performance metrics,
// It is currently used by the groups Module to register and process
// the completion of an assigned kahoot.
// It also feeds the leaderboard system within that module with final scores and accuracy data.
export class SoloAttemptCompletedEvent extends DomainEvent {
  constructor(
    public readonly attemptId: AttemptId,
    public readonly playerId: PlayerId,
    public readonly kahootId: KahootId,
    public readonly finalScore: Score,
    public readonly accuracyPercentage: number,
    public readonly totalCorrectAnswers: number,
    public readonly totalQuestions: number,
  ) {
    super(SoloAttemptCompletedEvent.name);
  }
}
