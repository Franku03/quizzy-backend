import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

import { QuestionResultsPlayerResponse, QuestionResultsResponse } from "../response-dtos/question-results.response.dto";

import { COMMON_ERRORS } from "../commands/common.errors";
import { HOST_NEXT_PHASE_ERRORS } from "../commands/host-next-phase/host-next-phase.errors";

import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";
import { PlayerScoreboardEntry } from "../response-dtos/types/player-scoreboard-entry.interface";
import { FeedbackGenerator } from "../helpers/feedback-generator.helper";

export const mapEntriesToResultsResponse = ( session: MultiplayerSession, kahoot: Kahoot, previousSlideId: SlideId): QuestionResultsResponse => {


    // Primero mapeamos las respuestas correctas    
    const currentSlideSnapshot: SlideSnapshot | null = kahoot.getSlideSnapshotById( previousSlideId );

    if( !currentSlideSnapshot )
        throw new Error(COMMON_ERRORS.SLIDE_NOT_FOUND);

    if( !currentSlideSnapshot.options )
        throw new Error(COMMON_ERRORS.NO_OPTIONS);

    const correctAnswerId: string[] = []
    const optionsId: string[] = []
    
    currentSlideSnapshot.options?.forEach( ( option, index ) => { 
        
        if( option.isCorrect )
            correctAnswerId.push( index.toString() );

        optionsId.push( index.toString() )
        
    });

    if( correctAnswerId.length === 0)
        throw new Error(HOST_NEXT_PHASE_ERRORS.NO_VALID_OPTION);
    

    // Ahora mapeamos todo lo referente al scoreboard y las stats para el host

    const progress = {
        current: session.getCurrentSlideIndex(), // No restamos 1 porque realmente nos interesa tener el valor del indice actual
        total: session.getTotalOfSlides(),
    }

    const entries = session.getPlayersRankingEntries();
    const scoreboard: PlayerScoreboardEntry[] = [];
    const playerData: Map<string, QuestionResultsPlayerResponse> = new Map();

    entries.forEach( entry => {

        const playerId = entry.getPlayerId()

        scoreboard.push({
            playerId: playerId.value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
        });

        const playerAnswer = session.getOnePlayerAnswerForASlide( previousSlideId, playerId );

        if( playerAnswer ){

            const streak = session.getPlayerById( playerId ).getStreak()
            
            const motivationalMessage = FeedbackGenerator.generate({
                isCorrect: playerAnswer.isCorrect(),
                currentStreak: streak,
                rank: entry.getRank(),
                score: entry.getScore()
            });

            playerData.set( entry.getPlayerId().value , {
    
                isCorrect: playerAnswer.isCorrect(),
                pointsEarned: playerAnswer.getEarnedScore(),
                totalScore: entry.getScore(),
                rank: entry.getRank(),
                previousRank: entry.getPreviousRank(),
                streak: streak,
                correctAnswerIds: correctAnswerId,
                message: motivationalMessage, 
                progress: progress,
                
            });
            
        }

    })

    // Obtenemos solo el Top 5 para el host
    const leaderboard = scoreboard.slice(0, 5);

    const stats = {

        totalAnswers: session.getNumberOfAnswersForASlide( previousSlideId ),
        distribution: session.calculateAnswerDistributionForASlide( previousSlideId, optionsId )

    }

    return {

        type: HostNextPhaseType.QUESTION_RESULTS,
        hostData: {
            state: session.getSessionStateType(),
            correctAnswerId: correctAnswerId,
            leaderboard: leaderboard,
            stats: stats,
            progress: {
                ...progress,
                isLastSlide: !session.hasMoreSlidesLeft(), 
            },
        },
        playerData: playerData

    };

}