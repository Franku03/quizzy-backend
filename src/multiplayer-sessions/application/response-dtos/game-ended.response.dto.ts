import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./types/player-scoreboard-entry.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";

export interface HostEndGameResponse {
    state: SessionStateType, 
    finalPodium: PlayerScoreboardEntry[]; // Los Top 3 o Top 5 para la animación
    winner: PlayerScoreboardEntry;   // Acceso rápido al ganador para efectos especiales
    totalParticipants: number;
}

// Payload para el JUGADOR (Su resultado final)
export interface PlayerEndGameResponse {
    rank: number;          // "Quedaste en el puesto 15"
    totalScore: number;    // "Hiciste 12,000 puntos"
    isPodium: boolean;     // Para mostrar un diseño dorado/especial si quedó en el top 3
    isWinner: boolean;     // Para mostrar "¡GANASTE!" vs "Buen intento"
    finalStreak: number;
}


export interface GameEndedResponse {
    type: HostNextPhaseType.GAME_END,
    hostData: HostEndGameResponse,
    playerData: Map<string, PlayerEndGameResponse>
}