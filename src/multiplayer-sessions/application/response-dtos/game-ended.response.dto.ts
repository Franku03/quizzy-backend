import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./player-scoreboard-entry.interface";



export interface GameEndedResponse {
    state: SessionStateType, 
    finalScoreboard: PlayerScoreboardEntry[], 
    winnerNickname: string, // nickname del ganador
}