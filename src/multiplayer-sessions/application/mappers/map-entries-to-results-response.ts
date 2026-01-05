import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

import { QuestionResultsPlayerResponse, QuestionResultsResponse } from "../response-dtos/question-results.response.dto";

import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";
import { getOptionsIdsAndCorrectAnswers, mapHostResultsData, mapPlayerResultsData } from "../helpers";

import { COMMON_ERRORS } from "../commands/common.errors";

export const mapEntriesToResultsResponse = ( session: MultiplayerSession, kahoot: Kahoot ): QuestionResultsResponse => {

    // Primero Obtenemos la slide previa en la sesión
    const previousSlideId = session.getPreviousSlideInSession();    

    if( !previousSlideId )
        throw new Error(COMMON_ERRORS.PREVIOUS_SLIDE_NOT_FOUND);

    // Luego mapeamos las respuestas correctas de la slide previa   
    const { correctAnswerId, optionsId } = getOptionsIdsAndCorrectAnswers( kahoot, previousSlideId );
    
    // Ahora mapeamos todo lo referente al scoreboard y las stats para el host
    const hostData = mapHostResultsData( session, previousSlideId, { correctAnswerId, optionsId } );        

    // Ahora mapeamos la info de cada jugador
    const entries = session.getPlayersRankingEntries();
    const playerData: Map<string, QuestionResultsPlayerResponse> = new Map();

    entries.forEach( entry => {

        const entryDataMapped = mapPlayerResultsData( session, previousSlideId, entry, { correctAnswerId, optionsId } );        

        playerData.set( entry.getPlayerId().value , entryDataMapped );
    
    })


    return {

        type: HostNextPhaseType.QUESTION_RESULTS,
        hostData: {
            ...hostData
        },
        playerData: playerData

    };

}