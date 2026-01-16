/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\request-dtos\modify-group.request.dto.ts

import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    @Length(3, 20)
    name?: string;

    @IsString()
    @IsOptional()
    @Length(0, 200)
    description?: string;
}