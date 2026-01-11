/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\types\player-scoreboard-entry.interface.ts

export interface PlayerScoreboardEntry {
    playerId: string
    nickname: string,
    score: number,            // Puntaje total acumulado
    rank: number,             // Posición actual (1, 2, 3...)
    previousRank: number,     // (Opcional) Para hacer un cambio de puesto (aunque ni sé si se usará aún)
}
