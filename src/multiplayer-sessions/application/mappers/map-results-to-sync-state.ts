/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\map-results-to-sync-state.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

import { SyncStateResponse } from "../response-dtos";
import { getOptionsIdsAndCorrectAnswers, isHost, mapHostResultsData, mapPlayerResultsData } from "../helpers";

import { SyncStateCommand } from "../commands";
import { COMMON_ERRORS } from "../commands/common.errors";
import { SyncType } from "../response-dtos/enums/sync-type.enum";
import { Either } from "src/core/types";
import { ErrorData } from '../../../core/errors/error.type';
import { createSlideNotFoundError } from "../commands/context/errors/create-handler-errors.error";

export const mapResultsToSyncState = ( 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    userInfo: SyncStateCommand 
): Either< ErrorData,SyncStateResponse> => {
    
    // Primero Obtenemos la slide previa en la sesión o la actual si el progreso nos dice que no hay más slides disponibles
    const slideId = session.hasMoreSlidesLeft() ? session.getPreviousSlideInSession() : session.getCurrentSlideInSession()

    if( !slideId )
        return Either.makeLeft( createSlideNotFoundError("getPreviousSlideSnapshotById | getSlideSnapshotById", kahoot.id.value ) )

    // mapeamos las respuestas correctas de la slide previa   
    const result = getOptionsIdsAndCorrectAnswers( kahoot, slideId );

    if( result.isLeft() ) 
        return Either.makeLeft( result.getLeft() )

    const { correctAnswerId, optionsId } = result.getRight() ;

    if( isHost( userInfo.userId , session.getHostId().value ) ) {

        const hostData = mapHostResultsData( session, slideId, { correctAnswerId, optionsId } );        

        return Either.makeRight({ type: SyncType.HOST_RESULTS, data: {...hostData } });

    } else {

        const entry = session.getOnePlayerRankingEntry( new PlayerId( userInfo.userId ) );

        const playerData = mapPlayerResultsData( session, slideId, entry, { correctAnswerId, optionsId } );        

        return Either.makeRight({ type:SyncType.PLAYER_RESULTS, data: { ...playerData } });

    }

}