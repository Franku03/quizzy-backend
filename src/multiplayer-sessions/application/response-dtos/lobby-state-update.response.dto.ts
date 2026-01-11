/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\lobby-state-update.response.dto.ts

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";


interface PlayerData {
    
    playerId: string,
    nickname: string,
    // * avatarURL: string, 
}


export interface PlayerLobbyUpdateResponse {

    state: SessionStateType,
    nickname: string,
    score: number,
    connectedBefore: boolean, 
}

export interface HostLobbyUpdateResponse {

    state: SessionStateType,
    players: PlayerData[],
    numberOfPlayers: number,

}

export interface LobbyStateUpdateResponse {


   hostLobbyUpdate?: HostLobbyUpdateResponse;

   playerLobbyUpdate: PlayerLobbyUpdateResponse;
        
}
