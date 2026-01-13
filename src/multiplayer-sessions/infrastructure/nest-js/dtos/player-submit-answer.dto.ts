/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\dtos\player-submit-answer.dto.ts

import { IsArray, IsNumber, IsString, IsUUID, Min } from "class-validator";

export class PlayerSubmitAnswerDto {

    @IsUUID()
    questionId: string;


    @IsArray()
    @IsString({ each: true })
    answerId: string[];


    @IsNumber()
    @Min( 0 )
    timeElapsedMs: number;

}