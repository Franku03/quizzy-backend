/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\dtos\kahoot.slide.handler.response.dto.ts

import { OptionHandlerResponseDto } from './kahoot.slide.option.handler.response.dto';

export class SlideHandlerResponseDto {
  id: string;
  text: string | null;
  mediaId: string | null;
  type: string;
  timeLimit: number;
  points: number | null;
  position: number;
  answers: OptionHandlerResponseDto[] | null;
}
