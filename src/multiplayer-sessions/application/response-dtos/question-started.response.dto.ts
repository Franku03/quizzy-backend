import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { SlideSnapshotWithoutAnswers } from "./slide-without-answers.interface";

export interface QuestionStartedResponse {


    isGameEnded?: boolean, // Para host next phase, quitar cuando hayan eventos de dominio

    state: SessionStateType,

    questionIndex: number,

    currentSlideData: SlideSnapshotWithoutAnswers
    
}