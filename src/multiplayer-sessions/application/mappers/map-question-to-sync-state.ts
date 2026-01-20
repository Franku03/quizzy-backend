/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\map-question-to-sync-state.ts

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
        
    // 1) Calculamos tiempo transcurrido (en Milisegundos)
    const timeElapsed = Date.now() - session.getCurrentQuestionStartTime().getTime();
    
    // 2) Convertimos el límite de la slide a Milisegundos
    const timeLimitMs = (currentSlideSnapshot?.timeLimitSeconds || 0) * 1000;

    // 3) Ahora la resta tiene sentido (ms - ms)
    const timeRemaining = Math.max(0, timeLimitMs - timeElapsed);
    

    const hasAnswered = !isHost(userInfo.userId, session.getHostId().value)
                            ? session.hasPlayerAnsweredSlide( currentSlideId, playerId )
                            : undefined; // Quiere decir que es un host, este no responde preguntas y por tanto el atributo sobra

    return {

        type: SyncType.QUESTION_STARTED,

        data: {
        
            ...question,
                    
        },

        additionalData: {
            timeRemainingMs: timeRemaining,
            // Importante: Chequear si ya respondió para bloquear la capacidad de respuesta o renderizar el front de otra forma
            hasAnswered: hasAnswered
        }
    };

}