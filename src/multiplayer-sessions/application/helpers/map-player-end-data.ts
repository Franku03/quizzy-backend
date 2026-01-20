/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-player-end-data.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { ScoreboardEntry } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerEndGameResponse } from "../response-dtos";

export const mapPlayerEndData = ( session: MultiplayerSession, entry: ScoreboardEntry ): PlayerEndGameResponse => {

    const state = session.getSessionStateType();

    const playerId = entry.getPlayerId()

    const player = session.getPlayerById( playerId );

    const rank = entry.getRank()

    return player 
    
    ? {
        state: state,
        rank: rank,         
        totalScore: player.getScore(),   
        isPodium: rank >= 1 && rank <= 3,    
        isWinner: rank === 1,     
        finalStreak: player.getStreak(),
    }
    : { // Caso raro donde un cliente no estaba registrado en el domain
        state: state,
        rank: rank,         
        totalScore: 0,   
        isPodium: rank >= 1 && rank <= 3,    
        isWinner: rank === 1,     
        finalStreak: 0,
    }

}