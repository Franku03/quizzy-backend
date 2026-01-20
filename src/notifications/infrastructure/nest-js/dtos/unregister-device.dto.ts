/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\notifications\infrastructure\nest-js\dtos\unregister-device.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';

export class UnregisterDeviceDto {
    @IsString({ message: 'El token debe ser un string.' })
    @IsNotEmpty({ message: 'El token es obligatorio.' })
    public readonly token: string;
}
