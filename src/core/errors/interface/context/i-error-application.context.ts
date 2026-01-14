/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\context\i-error-application.context.ts

import { IErrorContext } from './i-error-context.interface';

export interface IApplicationErrorContext extends IErrorContext {
  // operation (UseCase) viene de IErrorContext
  resourceTargetId?: string; // El ID del recurso: 'kahoot_123'
  resourceType?: string; // El tipo de recurso: 'Kahoot', 'Slide', 'User'
}
