import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "../aggregates/multiplayer-session";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";

import { PlayerId, SessionPlayerAnswer } from "../value-objects";
import { PlayerIdValue } from "../types/id-value.types";
import { SlideId } from '../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id';

export class PlayerSubmissionEvaluationService {
    

    // La submission ya viene construida en base al DTO desde el servicio de aplicacion
    public evaluatePlayerSubmission(
       kahoot: Kahoot,
       session: MultiplayerSession, 
       submission: [PlayerIdValue, Submission], // Evaluar si capaz es mejor un arreglo de tuplas I dunno
       slideId: SlideId
    ): void {

        const [ playerIdValue, playerSubmission ] = submission;

        // Creamos este Id temporal para buscar al jugador, y obtener su id ya en memoria
        const tempId = new PlayerId( playerIdValue );

        const playerId = session.getPlayerById( tempId ).id;

        // ? Momento donde se evalua la respuesta
        const result = kahoot.evaluateAnswer( playerSubmission );

        const playerEvaluation = SessionPlayerAnswer.create( result, playerId );

        // * Anadimos la respuesta a su respectivo SlideResults
        session.addPlayerAnswer( slideId, playerEvaluation );

        
    }

}