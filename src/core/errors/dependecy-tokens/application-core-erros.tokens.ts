/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\dependecy-tokens\application-core-erros.tokens.ts

export const ERROR_TOKENS = {
    MAPPERS: {
        MONGO: Symbol('MONGO_ERROR_MAPPER'),
        CLOUDINARY: Symbol('CLOUDINARY_ERROR_MAPPER'),
        POSTGRES: Symbol('POSTGRES_ERROR_MAPPER'),
        PIN: Symbol('PIN_GENERATOR_ERROR_MAPPER'),
    }
};