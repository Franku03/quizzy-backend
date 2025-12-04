import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects"

export interface JoinPlayerDtoResponse {

    
    hostId: string, 
    state: SessionStateType,
    players: "array<object>",
    quizTitle?: "BacktoSchoolquizgame",
    quizMediaUrl?: "https://cdn.../back_to_school.jpg",
    currentSlideData?: SlideSnapshot,
        
}
