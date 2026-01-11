/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\response-dtos\create-session.response.dto.ts

export interface CreateSessionResponse {

    readonly sessionPin: string,
    readonly qrToken: string,

    // Kahoot Info (para el host que creo la sesion)
    quizTitle: string, 
    coverImageUrl: string;
    theme: {
        id: string;
        url: string;
        name: string;
    } | null;

}