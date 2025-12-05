import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"
import { SlideSnapshotWithoutAnswers } from "./slide-without-answers.interface";


interface PlayerData {
    
    playerId: string,
    nickname: string,
    // * avatarURL: string, 
}

interface KahootStyling {
    
    ImageUrl?: string,
    ThemeUrl?: string,
    // * avatarURL: string, 
}

export interface GameStateUpdateResponse {

    hostId: string, 
    state: SessionStateType,
    players: PlayerData[],
    quizTitle?: string, // No siempre hara falta pasar esto en un GameStateUpdate
    quizMediaUrls?: KahootStyling, // No siempre hara falta pasar esto en un GameStateUpdte
    currentSlideData?: SlideSnapshotWithoutAnswers, // Esto solo lo devolvemos para cuando un jugador que se reconecta
        
}
