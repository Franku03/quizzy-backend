/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\application\commands\change-username\change-username.errors.ts

export const CHANGE_USERNAME_ERRORS = {
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USERNAME_ALREADY_TAKEN: 'USERNAME_ALREADY_TAKEN',
    USERNAME_CHANGE_COOLDOWN: 'USERNAME_CHANGE_COOLDOWN',
} as const;