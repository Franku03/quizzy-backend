import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";


interface PlayerData {
    
    playerId: string,
    nickname: string,
    // * avatarURL: string, 
}


export interface PlayerLobbyUpdateResponse {

    connected: boolean,
    state: SessionStateType,
    nickname: string,
    score: number,

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
