/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\helpers\i-evalutaion.strategy.ts

import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Option } from "../value-objects/kahoot.slide.option";

export interface EvaluationStrategy {
    evaluateAnswer(submission: Submission, options: Option[]): Result;
}