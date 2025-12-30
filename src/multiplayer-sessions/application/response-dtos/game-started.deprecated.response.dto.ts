import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";

// ! DEPRECATED deberia borrarse pronto, ahora usamos QuestionStartedResponse
export interface GameStartedResponse {

    state: SessionStateType,
    questionIndex: number,
    currentSlideData: SlideSnapshotWithoutAnswers,

}