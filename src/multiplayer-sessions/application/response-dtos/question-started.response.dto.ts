/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\question-started.response.dto.ts

import { SessionStateType } from "src/multiplayer-sessions/domain/value-objects";
import { SlideSnapshotWithoutAnswers } from "./types/slide-without-answers.interface";
import { HostNextPhaseType } from "./enums/host-next-phase-type.enum";
import { QuestionAdditionalData } from "./sync-state.response.dto";

export interface QuestionStartedResponse {
    type: HostNextPhaseType.QUESTION_STARTED,
    data: {
        state: SessionStateType,
        // questionIndex: number,
        currentSlideData: SlideSnapshotWithoutAnswers,
    }
    additionalData?: QuestionAdditionalData
}