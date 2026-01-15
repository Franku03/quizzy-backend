/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\constants\kahoot.slide.rules.ts

import { GLOBAL_MAX_QUESTION_LENGTH } from './../../../core/domain/shared-value-objects/constants/global-kahoot-constants';

export const SLIDE_POINTS_STD: readonly number[] = [0, 1000, 2000];

export const SLIDE_POINTS_MULTIPLE: readonly number[] = [0, 500, 1000];

export const MAX_OPTION_CHARS_TYPEANSWER = 20;

export const MAX_SLIDE_DESC_CHARS = 250;

export const MAX_OPTION_TEXT_LENGTH = 75;

export const MAX_QUESTION_LENGTH = GLOBAL_MAX_QUESTION_LENGTH;
