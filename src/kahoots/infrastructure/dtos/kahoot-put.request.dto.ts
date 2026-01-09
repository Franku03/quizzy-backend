/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\dtos\kahoot-put.request.dto.ts

import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { CreateKahootDTO } from "./kahoot-post.request.dto";

export class UpdateKahootDTO extends CreateKahootDTO {
    //Esta class perdio la razon de ser peor bueno se mantiene por si acaso
    //Eso es debido a que es un put y es esencia un post porque se modifica lo mismo 
}