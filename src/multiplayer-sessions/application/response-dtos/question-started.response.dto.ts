import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";

export interface QuestionStartedResponse {
    type: HostNextPhaseType.QUESTION_STARTED,
    data: {
        state: SessionStateType,
        questionIndex: number,
        currentSlideData: SlideSnapshotWithoutAnswers,
    }
}