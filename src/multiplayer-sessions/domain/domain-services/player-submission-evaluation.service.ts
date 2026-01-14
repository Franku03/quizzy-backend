/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\domain\domain-services\player-submission-evaluation.service.ts

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";

import { PlayerId, SessionPlayerAnswer } from "../value-objects";
import { PlayerIdValue } from "../types/id-value.types";
import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { Either, ErrorData } from "src/core/types";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";

export class PlayerSubmissionEvaluationService {
    

    // La submission ya viene construida en base al DTO desde el servicio de aplicacion
    public evaluatePlayerSubmission(
       kahoot: Kahoot,
       session: MultiplayerSession, 
       submission: [PlayerIdValue, Submission],
       slideId: SlideId
    ): Either< ErrorData, void > {

        const [ playerIdValue, playerSubmission ] = submission;

        // Verificamos que estemos en etapa QUESTION, en otros estados no se puede suministrar respuestas
        if( !session.getSessionState().isQuestion() ){
            const error = new Error("No se pueden suministrar respuestas cuando no hay pregunta en juego!");;
            return Either.makeLeft( this.buildEvaluationErrorData( error, playerIdValue ) ) ;
        }

        // Creamos este Id temporal para buscar al jugador, y obtener su id ya en memoria
        const tempId = new PlayerId( playerIdValue );

        // Verificamos que el jugador no haya respondido ya
        if( session.hasPlayerAnsweredSlide( slideId, tempId ) ){
            const error = new Error("El jugador ya ha enviado una respuesta para esta pregunta.");;
            return Either.makeLeft( this.buildEvaluationErrorData( error, tempId.value ) ) ;
        }

        // Creamos el id temporal del jugador
        const playerId = session.getPlayerById( tempId )?.id;

        // Nos aseguramos que se encuentre en la partida
        if( !playerId ){
            const error = new Error("El jugador no se encuentra en la partida");;
            return Either.makeLeft( this.buildEvaluationErrorData( error, tempId.value ) ) ;
        }

        // ? Momento donde se evalua la respuesta
        const result = kahoot.evaluateAnswer( playerSubmission );

        // Creamos la respuesta del jugador
        const playerEvaluation = SessionPlayerAnswer.create( result, playerId );

        // * Anadimos la respuesta a su respectivo SlideResults
        const addResult =  session.addPlayerAnswer( slideId, playerEvaluation );

        if( addResult.isLeft() ){
            return Either.makeLeft( addResult.getLeft() ) ;
        }  

        return Either.makeRight( undefined );
    }


    private buildEvaluationErrorData( error: Error, playerId: string ): ErrorData {

        return DomainErrorFactory.validation(
            createDomainContext('evaluatePlayerSubmission', 'DomainService', { actorId: playerId, domainObjectKind: 'Entity', rootAggregateName: 'MultiplayerSession'} ),
            {},
            error.message
        );

    }
    
    

}