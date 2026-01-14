/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\game-ended.response.dto.ts

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerScoreboardEntry } from "./types/player-scoreboard-entry.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";
import { PlayerResponseData } from "./types/player-response-data.interface";
import { SessionTheme } from "./types/session-theme.interface";

export interface HostEndGameResponse {
    state: SessionStateType, 
    finalPodium: PlayerScoreboardEntry[]; // Los Top 3 o Top 5 para la animación
    winner: PlayerScoreboardEntry;   // Acceso rápido al ganador para efectos especiales
    totalParticipants: number;
}

// Payload para el JUGADOR (Su resultado final)
export interface PlayerEndGameResponse extends PlayerResponseData {
    state: SessionStateType,
    rank: number;          // "Quedaste en el puesto 15"
    totalScore: number;    // "Hiciste 12,000 puntos"
    isPodium: boolean;     // Para mostrar un diseño dorado/especial si quedó en el top 3
    isWinner: boolean;     // Para mostrar "¡GANASTE!" vs "Buen intento"
    finalStreak: number;
    theme?: SessionTheme  // Para caso de sincronización y recuperar imagen de fondo
}


export interface GameEndedResponse {
    type: HostNextPhaseType.GAME_END,
    hostData: HostEndGameResponse,
    playerData: Map<string, PlayerEndGameResponse>
}