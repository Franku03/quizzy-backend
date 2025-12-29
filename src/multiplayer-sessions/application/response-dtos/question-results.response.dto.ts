import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./player-scoreboard-entry.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";


export interface QuestionResultsResponse {
    type: HostNextPhaseType.QUESTION_RESULTS,
    data: {
        state: SessionStateType, 
        correctAnswerId: string[], 
        playerScoreboard: PlayerScoreboardEntry[], 
    }
}