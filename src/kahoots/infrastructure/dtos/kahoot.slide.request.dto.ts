/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\kahoot.slide.request.dto.ts

import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { cleanNullToUndefined, toUpperCase } from './helper.request.dto';
import { OptionInputDTO } from './kahoot.slide.option.request.dto';

export class SlideInputDTO {
  // id: UUID (Question ID). Opcional si es un slide nuevo, Requerido si es update.
  @IsOptional()
  @IsUUID()
  id?: string;

  // type: String (Obligatorio)
  @IsString()
  @Transform(toUpperCase)
  type: string;

  // timeLimit: Integer (Obligatorio)
  @IsInt()
  @Min(1)
  timeLimit: number;

  // points: Integer (Opcional, puede ser null). Purgamos null a undefined.
  @IsOptional()
  @IsInt()
  @Transform(cleanNullToUndefined)
  points?: number;

  // text: String (Opcional). Purgamos null a undefined.
  @IsOptional()
  @IsString()
  @Transform(cleanNullToUndefined)
  text?: string;

  // mediaId: URL (Opcional). Purgamos null a undefined.
  @IsOptional()
  @IsString()
  @Transform(cleanNullToUndefined)
  mediaId?: string;

  // answers: Array anidado (Opcional). Aseguramos la transformación recursiva.
  @Type(() => OptionInputDTO)
  @IsOptional()
  answers?: OptionInputDTO[];
}
