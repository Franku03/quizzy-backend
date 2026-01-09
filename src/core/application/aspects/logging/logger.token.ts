/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\application\aspects\logging\logger.token.ts

// core/application/logging/logger.token.ts

// This token is used for dependency injection of the ILogger interface.
// It allows different implementations of ILogger to be swapped in
// without changing the application code that depends on it.
export const LOGGER_TOKEN = 'ILogger';