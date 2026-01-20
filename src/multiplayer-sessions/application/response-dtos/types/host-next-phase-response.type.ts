/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\types\host-next-phase-response.type.ts

import { QuestionStartedResponse } from "../question-started.response.dto";
import { QuestionResultsResponse } from "../question-results.response.dto";
import { GameEndedResponse } from "../game-ended.response.dto";

export type HostNextPhaseResponse = QuestionStartedResponse | QuestionResultsResponse | GameEndedResponse;
