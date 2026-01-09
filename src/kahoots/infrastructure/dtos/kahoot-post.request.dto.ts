/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\kahoot-post.request.dto.ts

import { Transform, Type } from "class-transformer";
import { IsOptional, IsString, IsUUID } from "class-validator";
import { cleanNullToUndefined, toUpperCase } from "./helper.request.dto";
import { SlideInputDTO } from "./kahoot.slide.request.dto";

export class CreateKahootDTO {
    // Campos opcionales - //Todo dependen del estado del kahoot (DRAFT/PUBLISH)
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    title?: string;

    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    description?: string;
    
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    coverImageId?: string;
    
    @IsOptional()
    @IsString()
    @Transform(cleanNullToUndefined) 
    category?: string;

    // Campos requeridos
    @IsString()
    @Transform(toUpperCase)
    status: string; // "DRAFT" o "PUBLISHED"
    
    @IsString()
    @Transform(toUpperCase)
    visibility: string; // "PRIVATE" o "PUBLIC"
    
    @IsUUID()
    themeId: string;
    
    // Array opcional - la validación de "published requiere questions" va en dominio
    @Type(() => SlideInputDTO)
    @IsOptional()
    questions?: SlideInputDTO[];
}