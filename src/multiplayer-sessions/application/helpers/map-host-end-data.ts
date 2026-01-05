import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { HostEndGameResponse } from "../response-dtos";


export const mapHostEndData = ( session: MultiplayerSession ): HostEndGameResponse => {

    const state = session.getSessionStateType();
    
    const playerPodium = session.getTopThree().map( entry => ({
            playerId: entry.getPlayerId().value,
            nickname: entry.getNickname(),
            score: entry.getScore(),            
            rank: entry.getRank(),          
            previousRank: entry.getPreviousRank(),  
    }));

    return {
        state: state,
        finalPodium: playerPodium,
        winner: playerPodium[0],
        totalParticipants: session.getPlayers().length,
    };


}