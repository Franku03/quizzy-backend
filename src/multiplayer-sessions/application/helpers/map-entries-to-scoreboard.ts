import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { QuestionResultsResponse } from "../response-dtos/question-results.response.dto";
import { COMMON_ERRORS } from "../commands/common.errors";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { HOST_NEXT_PHASE_ERRORS } from "../commands/host-next-phase/host-next-phase.errors";

export const mapEntriesToResponse = ( session: MultiplayerSession, kahoot: Kahoot): QuestionResultsResponse => {

    const currentSlideIndex = session.getTotalOfSlidesAnswered();

    const entries = session.getPlayersRankinEntries();
    
    const currentSlideSnapshot: SlideSnapshot | null = kahoot.getNextSlideSnapshotByIndex( currentSlideIndex - 1 );

    if( !currentSlideSnapshot )
        throw new Error(COMMON_ERRORS.SLIDE_NOT_FOUND);

    if( !currentSlideSnapshot.options )
        throw new Error(COMMON_ERRORS.NO_OPTIONS);

    const correctAnswerId: string[] = []
    
    currentSlideSnapshot.options?.forEach( ( option, index ) => { 
        
        if( option.isCorrect )
            correctAnswerId.push( index.toString() );
        
    });

    if( correctAnswerId.length === 0)
        throw new Error(HOST_NEXT_PHASE_ERRORS.NO_VALID_OPTION);
    
    const scoreboard = entries.map( entry => ({
            playerId: entry.getPlayerId().value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
    }))


    return {
        state: session.getSessionStateType(),
        correctAnswerId: correctAnswerId,
        playerScoreboard: scoreboard,
    };

}