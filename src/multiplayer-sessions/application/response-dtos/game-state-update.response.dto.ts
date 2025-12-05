import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"

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
    currentSlideData?: SlideSnapshot, // Esto solo lo devolvemos pa un jugador que se reconecta
        
}
