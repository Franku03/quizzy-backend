import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

import { SyncStateResponse } from "../response-dtos";
import { getOptionsIdsAndCorrectAnswers, isHost, mapHostResultsData, mapPlayerResultsData } from "../helpers";

import { SyncStateCommand } from "../commands";
import { COMMON_ERRORS } from "../commands/common.errors";
import { SyncType } from "../response-dtos/enums/sync-type.enum";

export const mapResultsToSyncState = ( 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    userInfo: SyncStateCommand 
): SyncStateResponse => {
    
    // Primero Obtenemos la slide previa en la sesión o la actual si el progreso nos dice que no hay más slides disponibles
    const slideId = session.hasMoreSlidesLeft() ? session.getPreviousSlideInSession() : session.getCurrentSlideInSession()

    if( !slideId )
        throw new Error(COMMON_ERRORS.PREVIOUS_SLIDE_NOT_FOUND);

    // mapeamos las respuestas correctas de la slide previa   

    const { correctAnswerId, optionsId } = getOptionsIdsAndCorrectAnswers( kahoot, slideId );


    if( isHost( userInfo.userId , session.getHostId().value ) ) {

        const hostData = mapHostResultsData( session, slideId, { correctAnswerId, optionsId } );        

        return { type: SyncType.HOST_RESULTS, data: {...hostData } };

    } else {

        const entry = session.getOnePlayerRankingEntry( new PlayerId( userInfo.userId ) );

        const playerData = mapPlayerResultsData( session, slideId, entry, { correctAnswerId, optionsId } );        

        return { type:SyncType.PLAYER_RESULTS, data: { ...playerData } };

    }

}