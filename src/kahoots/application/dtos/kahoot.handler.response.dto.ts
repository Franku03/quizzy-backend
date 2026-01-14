/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\dtos\kahoot.handler.response.dto.ts

import { SlideHandlerResponseDto } from './kahoot.slide.handler.response.dto';

export class KahootHandlerResponseDto {
  id: string;
  title: string | null;
  description: string | null;
  coverImageId: string | null;
  visibility: string;
  themeId?: string | null;
  theme?: {
    id: string;
    url: string;
    name: string;
  } | null;
  authorId: string;
  createdAt: string;
  playCount: number;
  category: string | null;
  status: string;
  questions: SlideHandlerResponseDto[] | null;
}
