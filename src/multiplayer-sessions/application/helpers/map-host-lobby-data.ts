/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-host-lobby-data.ts

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