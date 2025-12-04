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