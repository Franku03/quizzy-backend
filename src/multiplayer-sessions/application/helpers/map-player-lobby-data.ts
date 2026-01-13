/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\helpers\map-player-lobby-data.ts

import { MultiplayerSession } from "src/multiplayer-sessions/domain/aggregates/multiplayer-session"
import { PlayerLobbyUpdateResponse } from "../response-dtos"
import { PlayerId } from "src/multiplayer-sessions/domain/value-objects";

export const mapPlayerLobbyData = ( session: MultiplayerSession, userId: string ): PlayerLobbyUpdateResponse => {

    const playerId = new PlayerId( userId );

    const state = session.getSessionStateType();

    const player = session.getPlayerById( playerId );


    return player 
    
    ?{ 

        state: state,
        nickname: player.getPlayerNickname(),
        score: player.getScore(),
        connectedBefore: false, // Es false porque asumimos aca que el usuario se acaba de conectar por primera vez bajo ese nickname

    }
    
    : { // No deberia pasar pero un usuario no registrado deberia obtener algo así

        state: state,
        nickname: "UNREGISTERED",
        score: 0,
        connectedBefore: false,

    }; 


}