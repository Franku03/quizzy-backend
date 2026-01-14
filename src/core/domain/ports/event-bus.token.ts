/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\ports\event-bus.token.ts

// A token used for dependency injection of the EventBus implementation.
// This token acts as an identifier for the EventBus service within the NestJS framework.
// By using this token, different implementations of the EventBus can be swapped easily
// without changing the parts of the code that depend on it.
// It also enables singleton behavior for the EventBus across the application.
export const EVENT_BUS_TOKEN = 'EVENT_BUS';
