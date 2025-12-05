import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";

export interface QuestionStartedResponse {

    state: SessionStateType,

    questionIndex: number,

    currentSlideData: SlideSnapshot
    
}