import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";


interface PlayerData {
    
    playerId: string,
    nickname: string,
    // * avatarURL: string, 
}

interface KahootStyling {
    
    // ! Modificar en base a lo que requiera a futuro el enricher
    imageURL?: string,
    themeURL?: string,
    // * avatarURL: string, 
}


export interface PlayerStateUpdateResponse {

    connected: boolean,
    state: SessionStateType,
    nickname: string,
    score: number,
    quizTitle?: string, // No siempre hara falta pasar esto en un GameStateUpdate
    quizMediaURLs?: KahootStyling, // No siempre hara falta pasar esto en un GameStateUpdte
    currentSlideData?: SlideSnapshotWithoutAnswers, // Esto solo lo devolvemos para cuando un jugador que se reconecta

}

export interface HostLobbyUpdateResponse {

    state: SessionStateType,
    players: PlayerData[],
    numberOfPlayers: number,

}

export interface GameStateUpdateResponse {


   hostLobbyUpdate?: HostLobbyUpdateResponse;

   playerStateUpdate: PlayerStateUpdateResponse;
        
}
