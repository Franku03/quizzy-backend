/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\commands\request-dtos\join-group.request.dto.ts

import { IsNotEmpty, IsString } from "class-validator";

export class JoinGroupDto {
    @IsString()
    @IsNotEmpty()
    invitationToken: string;
}