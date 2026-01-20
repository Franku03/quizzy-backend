/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\request-dtos\generate-invitation.request.dto.ts

import { IsString, Matches, IsNotEmpty } from 'class-validator';

export class GenerateInvitationDto {
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d+d$/, { message: 'El formato debe ser días, ej: "7d"' })
    expiresIn: string = "7d";
}