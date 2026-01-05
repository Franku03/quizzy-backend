import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session"
import { HostLobbyUpdateResponse } from "../response-dtos"

export const mapHostLobbyData = ( session: MultiplayerSession ): HostLobbyUpdateResponse => {

    const state = session.getSessionStateType();

    const players = session.getPlayers().map( player => ({
        
        playerId: player.getPlayerId(),
        nickname: player.getPlayerNickname(),

    }));

    return {

        state: state,
        players: players,
        numberOfPlayers: players.length,

    }


}