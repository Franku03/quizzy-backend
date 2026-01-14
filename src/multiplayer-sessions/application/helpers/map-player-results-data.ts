/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-player-results-data.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ScoreboardEntry } from "src/multiplayer-sessions/domain/value-objects";
import { FeedbackGenerator } from "./feedback-generator.helper";
import { QuestionResultsPlayerResponse } from "../response-dtos";

export const mapPlayerResultsData = (

    session: MultiplayerSession, 
    slideId: SlideId, 
    entry: ScoreboardEntry,
    options: { correctAnswerId: string [], optionsId: string []}

): QuestionResultsPlayerResponse => {

    const state = session.getSessionStateType();

    const playerId = entry.getPlayerId();

    const playerAnswer = session.getOnePlayerAnswerForASlide( slideId, playerId );

    const progress = {
        current: session.getCurrentSlideIndex(), // No restamos 1 porque realmente nos interesa tener el valor del indice actual
        total: session.getTotalOfSlides(),
    }

    const player = session.getPlayerById( playerId );

    // Si hay respuesta asociada a la slide y existe el jugador, mappeamos una respuesta completa , en base a su respuesta
    if( playerAnswer && player ){

        // No debería haber problema dado que, si hay una respuesta registrada para el usuario, evidentemente existe en el dominio
        const streak = player.getStreak()
        
        const motivationalMessage = FeedbackGenerator.generate({
            isCorrect: playerAnswer.isCorrect(),
            currentStreak: streak,
            rank: entry.getRank(),
            score: entry.getScore()
        });

        return {
            state: state,
            isCorrect: playerAnswer.isCorrect(),
            pointsEarned: playerAnswer.getEarnedScore(),
            totalScore: entry.getScore(),
            rank: entry.getRank(),
            previousRank: entry.getPreviousRank(),
            streak: streak,
            correctAnswerIds: options.correctAnswerId,
            message: motivationalMessage, 
            progress: progress, 
            
        }
                    
    }

    // Respuesta default para usuarios que no respondieron, pero igual deben recuperar su info registrada
    return {
        state: state,
        isCorrect: false,
        pointsEarned: 0,
        totalScore: entry.getScore() ?? 0, 
        rank: entry.getRank() ?? 0,
        previousRank: entry.getPreviousRank() ?? 0, // Protego en caso de undefined, aunque sería raro que algo así ocurriese dado el flujo del mappeo y donde se ejecuta este método
        streak: player?.getStreak() ?? 0,
        correctAnswerIds: options.correctAnswerId,
        message: FeedbackGenerator.noAnswerMessages[Math.floor( Math.random() * FeedbackGenerator.noAnswerMessages.length )],
        progress: progress, 
    }

}