/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\mappers\map-end-to-sync-state.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session";
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

import { SyncStateCommand } from "../commands";
import { SyncStateResponse } from "../response-dtos";
import { isHost, mapHostEndData, mapPlayerEndData } from "../helpers";
import { SyncType } from "../response-dtos/enums/sync-type.enum";


export const mapEndToSyncState = ( 
    session: MultiplayerSession, 
    userInfo: SyncStateCommand 
): SyncStateResponse => {

    if( isHost( userInfo.userId , session.getHostId().value ) ){

        const hostData = mapHostEndData( session );

        return { type: SyncType.HOST_END_GAME, data: { ...hostData } }

    } else {

        const entry = session.getOnePlayerRankingEntry( new PlayerId( userInfo.userId ) );

        const playerData = mapPlayerEndData( session, entry );

        return { type: SyncType.PLAYER_END_GAME, data: { ...playerData } };
        
    }

}