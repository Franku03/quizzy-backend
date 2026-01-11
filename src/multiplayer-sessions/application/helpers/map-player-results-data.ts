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

    if( playerAnswer ){

        // No debería haber problema dado que, si hay una respuesta registrada para el usuario, evidentemente existe en el dominio
        const streak = session.getPlayerById( playerId )?.getStreak()!
        
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

    // Respuesta default para usuarios que no respondieron
    return {
        state: state,
        isCorrect: false,
        pointsEarned: 0,
        totalScore: 0, // O buscar su score en otro lado si fuera crítico
        rank: 0,
        previousRank: 0,
        streak: 0,
        correctAnswerIds: options.correctAnswerId,
        message: FeedbackGenerator.noAnswerMessages[Math.floor( Math.random() * FeedbackGenerator.noAnswerMessages.length )],
        progress: progress, 
    }

}