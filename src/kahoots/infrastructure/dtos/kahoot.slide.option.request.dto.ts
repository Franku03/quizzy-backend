/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\kahoot.slide.option.request.dto.ts

import { IsBoolean, IsOptional, IsString } from "class-validator";
import { cleanNullToUndefined } from "./helper.request.dto";
import { Transform } from "class-transformer";

export class OptionInputDTO {
    // text: String (Opcional, puede estar vacío). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    text?: string; 

    // mediaId: URL (String) (Opcional). Purgamos null a undefined.
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    mediaId?: string;
    
    // isCorrect: Boolean (Obligatorio en el input)
    @IsBoolean()
    isCorrect: boolean; 
}