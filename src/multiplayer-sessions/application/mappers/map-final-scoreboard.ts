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