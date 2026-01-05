import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";

import { SyncStateCommand } from "../commands";
import { SyncStateResponse } from "../response-dtos";

import { isHost, mapHostLobbyData, mapPlayerLobbyData } from "../helpers";
import { SyncType } from "../response-dtos/enums/sync-type.enum";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

export const mapLobbyToSyncState = ( 
    session: MultiplayerSession,
    userInfo: SyncStateCommand 
): SyncStateResponse => {


    if( isHost( userInfo.userId, session.getHostId().value ) ){

        const hostData = mapHostLobbyData( session );

        return { type: SyncType.HOST_LOBBY_UPDATE, data: { ...hostData } }

    } else if( session.isPlayerAlreadyJoined( new PlayerId( userInfo.userId ) )) {


        // Devolvermos ambas porque el Host debe ser notificado de la reconexion de un usuario registrado tambien, este ya paso por player join
        const playerData = mapPlayerLobbyData( session, userInfo.userId );

        const hostData = mapHostLobbyData( session );

        return { 
            type: SyncType.PLAYER_STATE_UPDATE, 
            data: { 
                hostLobbyUpdate: hostData,
                playerStateUpdate: playerData,
            } 
        }

    } else {

        return { type: SyncType.PLAYER_STATE_UPDATE, data: undefined, additionalData: { isJoined: false }  }

    }

}