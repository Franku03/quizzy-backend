/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\event-listeners\solo-attempt.listener.ts

import { SoloAttemptCompletedEvent } from "src/core/domain/domain-events/attempt-completed-event";
import { MarkAssignmentCompletedUseCase } from "../../application/use-cases/mark-assignment-completed.use-case";


export class SoloAttemptCompletedListener {

    constructor(
        private readonly markAssignmentCompletedUseCase: MarkAssignmentCompletedUseCase
    ) { }


    public async on(event: SoloAttemptCompletedEvent): Promise<void> {
        console.log(`[Groups] Evento recibido: Jugador ${event.playerId.value} completó Kahoot ${event.kahootId.value}`);

        await this.markAssignmentCompletedUseCase.execute({
            userId: event.playerId.value,
            kahootId: event.kahootId.value,
            attemptId: event.attemptId.value,
            score: event.finalScore.getScore()
        });
    }
}