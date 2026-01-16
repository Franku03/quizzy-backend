import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { PlayerId, SessionPlayerAnswer } from "src/multiplayer-sessions/domain/value-objects";


export class SessionPlayerAnswerValueObjectMother {


    public static createPlayerAnswerForSession( playerId: PlayerId ,playerSubmission: Submission, kahoot: Kahoot ): SessionPlayerAnswer {


        const result = kahoot.evaluateAnswer( playerSubmission );
        // Creamos la respuesta del jugador
        const playerEvaluation = SessionPlayerAnswer.create( result, playerId );

        return playerEvaluation;

    }

}