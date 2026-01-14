/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\dtos\player-join.dto.ts

import { IsString, MaxLength, MinLength } from "class-validator";

export class PlayerJoinDto {

    @MinLength(4)
    @MaxLength(20)
    @IsString()
    nickname: string;

}