import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { ScoreboardEntry } from "src/multiplayer-sessions/domain/value-objects";
import { PlayerEndGameResponse } from "../response-dtos";

export const mapPlayerEndData = ( session: MultiplayerSession, entry: ScoreboardEntry ): PlayerEndGameResponse => {

    const state = session.getSessionStateType();

    const playerId = entry.getPlayerId()

    const player = session.getPlayerById( playerId );

    const rank = entry.getRank()

    return {
        state: state,
        rank: rank,         
        totalScore: player.getScore(),   
        isPodium: rank >= 1 && rank <= 3,    
        isWinner: rank === 1,     
        finalStreak: player.getStreak(),
    }

}