import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

import { GameEndedResponse, PlayerEndGameResponse, } from "../response-dtos/game-ended.response.dto";
import { HostNextPhaseType } from "../response-dtos/enums/host-next-phase-type.enum";


export const mapFinalScoreboard = ( session: MultiplayerSession ): GameEndedResponse => {

    const state = session.getSessionStateType();
    
    const playerPodium = session.getTopThree().map( entry => ({
            playerId: entry.getPlayerId().value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
    }));

    const entries = session.getPlayersRankingEntries();

    const playerData: Map<string, PlayerEndGameResponse> = new Map();
    
    entries.forEach( entry => {

        const playerId = entry.getPlayerId()

        const player = session.getPlayerById( playerId );

        const rank = entry.getRank()
        

        playerData.set( entry.getPlayerId().value , {
            state: state,
            rank: rank,         
            totalScore: player.getScore(),   
            isPodium: rank >= 1 && rank <= 3,    
            isWinner: rank === 1,     
            finalStreak: player.getStreak(),

        });
            


    })

    const response: GameEndedResponse = {
        type: HostNextPhaseType.GAME_END,
        hostData: {
            state: state,
            finalPodium: playerPodium,
            winner: playerPodium[0],
            totalParticipants: session.getPlayers().length,
        },
        playerData: playerData
    };  

    return response;
}