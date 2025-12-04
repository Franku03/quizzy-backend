import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

export interface QuestionStartedResponse {

    questionIndex: number,

    currentSlideData: SlideSnapshot
    
}