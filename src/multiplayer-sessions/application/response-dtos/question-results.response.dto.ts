import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./player-scoreboard-entry.interface";


export interface QuestionResultsResponse {
    state: SessionStateType, 
    correctAnswerId: string[], 
    playerScoreboard: PlayerScoreboardEntry[], 
}