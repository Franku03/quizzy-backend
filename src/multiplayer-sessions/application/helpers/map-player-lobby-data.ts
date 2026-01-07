import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session"
import { PlayerLobbyUpdateResponse } from "../response-dtos"
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

export const mapPlayerLobbyData = ( session: MultiplayerSession, userId: string ): PlayerLobbyUpdateResponse => {

    const playerId = new PlayerId( userId );

    const state = session.getSessionStateType();

    const player = session.getPlayerById( playerId );

    return { 

        connected: true,
        state: state,
        nickname: player.getPlayerNickname(),
        score: player.getScore(),

    }; 


}