/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\mapper\i-error-mapper.interface.ts

import { ErrorData } from "../../error.type";

/**
 * Contrato que todos los mappers de error deben implementar
 * Aplicando DIP: Capas altas (servicios) dependen de esta abstracción
 */
export interface IErrorMapper<TError, TContext> {
    /**
     * Convierte un error nativo a ErrorData canónico
     * @param error Error original (MongoDB, Cloudinary, etc.)
     * @param context Contexto específico de la operación
     */
    toErrorData(error: TError, context: TContext): ErrorData;
}