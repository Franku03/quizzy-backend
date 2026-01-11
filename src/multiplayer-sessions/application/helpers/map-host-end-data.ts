/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-host-end-data.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { HostEndGameResponse } from "../response-dtos";


export const mapHostEndData = ( session: MultiplayerSession ): HostEndGameResponse => {

    const state = session.getSessionStateType();
    
    const playerPodium = session.getTopThree().map( entry => ({
            playerId: entry.getPlayerId().value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
    }));

    return {
        state: state,
        finalPodium: playerPodium,
        winner: playerPodium[0],
        totalParticipants: session.getPlayers().length,
    };


}