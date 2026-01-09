import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";
import { LobbyStateUpdateResponse } from "../response-dtos/lobby-state-update.response.dto";
import { mapHostLobbyData, mapPlayerLobbyData } from "../helpers";


export const mapJoinToLobbyUpdate = ( player: Player, session: MultiplayerSession ): LobbyStateUpdateResponse => {

    // Construimos la response del game_state_update
     
    // mapeamos la respuesta para el host
    const hostData = mapHostLobbyData( session );

    // mapeamos la respuesta para el player
    const playerData = mapPlayerLobbyData( session, player.getPlayerId() );

    return {

        hostLobbyUpdate: hostData,

        playerLobbyUpdate: playerData

    }; 



};