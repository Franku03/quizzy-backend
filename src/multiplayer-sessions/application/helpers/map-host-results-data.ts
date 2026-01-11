import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { PlayerScoreboardEntry } from "../response-dtos/types/player-scoreboard-entry.interface";

import { QuestionResultsHostResponse } from "../response-dtos";

export const mapHostResultsData = (
    session: MultiplayerSession, 
    slideId: SlideId, 
    options: { correctAnswerId: string [], optionsId: string []}
): QuestionResultsHostResponse => {

    // Ahora mapeamos todo lo referente al scoreboard y las stats para el host


    const state = session.getSessionStateType();

    const progress = {
        current: session.getCurrentSlideIndex(), // No restamos 1 porque realmente nos interesa tener el valor del indice actual
        total: session.getTotalOfSlides(),
    }


    const stats = {

        totalAnswers: session.getNumberOfAnswersForASlide( slideId ) ?? 0, // No deberia ocurrir si llegamos aca, pero protegemos de undefined
        distribution: session.calculateAnswerDistributionForASlide( slideId, options.optionsId )

    }

    // Solo nos interesa en este caso el top 5 del scoreboard para el host
    const entries = session.getTopFive();
    const leaderboard: PlayerScoreboardEntry[] = [];

    entries.forEach( entry => {

        const playerId = entry.getPlayerId()

        leaderboard.push({
            playerId: playerId.value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
        });

    });


    return {

        state: state,
        correctAnswerId: options.correctAnswerId,
        leaderboard: leaderboard,
        stats: stats,
        progress: {
            ...progress,
            isLastSlide: !session.hasMoreSlidesLeft(), 
        },

    }


};