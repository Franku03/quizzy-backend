/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\map-final-scoreboard.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";
import { GameEndedResponse, PlayerEndGameResponse, } from "../response-dtos/game-ended.response.dto";
import { mapHostEndData, mapPlayerEndData } from "../helpers";


export const mapFinalScoreboard = ( session: MultiplayerSession ): GameEndedResponse => {
    
    // Mappeamos la data para el host
    const hostData = mapHostEndData( session );

    // Ahora mappeamos la respuesta para cada jugador
    const entries = session.getPlayersRankingEntries();
    const playerData: Map<string, PlayerEndGameResponse> = new Map();
    
    entries.forEach( entry => {

        const mappedEntryData = mapPlayerEndData( session, entry );
        
        playerData.set( entry.getPlayerId().value , mappedEntryData );
            
    });

    const response: GameEndedResponse = {
        type: HostNextPhaseType.GAME_END,
        hostData: hostData,
        playerData: playerData
    };  

    return response;
}