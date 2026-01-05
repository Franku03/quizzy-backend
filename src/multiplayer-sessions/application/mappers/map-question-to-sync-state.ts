import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects/player.id";

import { QuestionStartedResponse, SyncStateResponse } from "../response-dtos";
import { SyncStateCommand } from "../commands";
import { SyncType } from "../response-dtos/enums/sync-type.enum";
import { isHost } from '../helpers/is-host.helper';

export const mapQuestionToSyncState = ( 
    session: MultiplayerSession, 
    kahoot: Kahoot,
    question: QuestionStartedResponse, 
    userInfo: SyncStateCommand 
): SyncStateResponse => {
    
    const currentSlideId = session.getCurrentSlideInSession();
    const playerId = new PlayerId( userInfo.userId);

    let currentSlideSnapshot: SlideSnapshot | null = kahoot.getSlideSnapshotById( currentSlideId );
        
    // Calculamos tiempo restante
    const timeElapsed = Date.now() - session.getCurrentQuestionStartTime().getTime();
    // Básicamente calcula el tiempo restante, pero si ya se acabó, devuelve 0, nunca un número negativo".
    const timeRemaining = Math.max(0, currentSlideSnapshot?.timeLimitSeconds! - timeElapsed);

    const hasAnswered = !isHost(userInfo.userId, session.getHostId().value)
                            ? session.hasPlayerAnsweredSlide( currentSlideId, playerId )
                            : undefined; // Quiere decir que es un host, este no responde preguntas y por tanto el atributo sobra

    return {

        type: SyncType.QUESTION_STARTED,

        data: {
        
            ...question,
                    
        },

        additionalData: {
            timeRemaining: timeRemaining,
            // Importante: Chequear si ya respondió para bloquear la capacidad de respuesta o renderizar el front de otra forma
            hasAnswered: hasAnswered
        }
    };

}