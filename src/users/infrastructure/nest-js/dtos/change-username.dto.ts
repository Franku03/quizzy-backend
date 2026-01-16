/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\infrastructure\nest-js\dtos\change-username.dto.ts

import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ChangeUsernameDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    @MaxLength(30)
    public readonly newUsername: string;
}