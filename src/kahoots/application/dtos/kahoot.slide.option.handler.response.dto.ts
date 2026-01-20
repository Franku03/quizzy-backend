/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\dtos\kahoot.slide.option.handler.response.dto.ts

export class OptionHandlerResponseDto {
  id: string;
  text: string | null;
  mediaId: string | null;
  isCorrect: boolean;
}
