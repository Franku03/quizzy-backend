import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { SlideSnapshotWithoutAnswers } from "./slide-without-answers.interface";

export interface GameStartedResponse {

    state: SessionStateType,
    questionIndex: number,
    currentSlideData: SlideSnapshotWithoutAnswers,

}