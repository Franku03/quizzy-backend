import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./player-scoreboard-entry.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";

export interface GameEndedResponse {
    type: HostNextPhaseType.GAME_END,
    data: {
        state: SessionStateType, 
        finalScoreboard: PlayerScoreboardEntry[], 
        winnerNickname: string, // nickname del ganador
    }
}