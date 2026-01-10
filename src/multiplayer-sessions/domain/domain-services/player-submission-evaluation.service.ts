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

        // Creamos este Id temporal para buscar al jugador, y obtener su id ya en memoria
        const tempId = new PlayerId( playerIdValue );

        // Verificamos que el jugador no haya respondido ya
        if( session.hasPlayerAnsweredSlide( slideId, tempId ) ){
            const error = new Error("El jugador ya ha enviado una respuesta para esta pregunta.");;
            return Either.makeLeft( this.buildEvaluationErrorData( error, tempId.value ) ) ;
        }

        const playerId = session.getPlayerById( tempId ).id;

        // ? Momento donde se evalua la respuesta
        const result = kahoot.evaluateAnswer( playerSubmission );

        const playerEvaluation = SessionPlayerAnswer.create( result, playerId );

        // * Anadimos la respuesta a su respectivo SlideResults
        session.addPlayerAnswer( slideId, playerEvaluation );

        return Either.makeRight( undefined );
    }


    private buildEvaluationErrorData( error: Error, playerId: string ): ErrorData {

        return DomainErrorFactory.validation(
            createDomainContext('evaluatePlayerSubmission', 'DomainService', { actorId: playerId, domainObjectKind: 'Entity', rootAggregateName: 'MultiplayerSession'} ),
            { hasAnswered: ['PLAYER_ALREADY_SUBMIT_ANSWER'] },
            error.message
        );

    }
    
    

}