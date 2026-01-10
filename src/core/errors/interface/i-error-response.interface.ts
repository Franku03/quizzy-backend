/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\i-error-response.interface.ts

export interface IErrorResponse {
    status: number;                     // Código HTTP
    code: string;                       // Código canónico interno
    message: string;                    // Mensaje amigable
    details?: Record<string, any>;      // Información adicional
    errorId: string;                    // ID único para trazabilidad
    timestamp?: string;                 // Opcional: cuando ocurrió
}