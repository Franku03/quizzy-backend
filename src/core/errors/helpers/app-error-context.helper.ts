/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\helpers\app-error-context.helper.ts

import { IApplicationErrorContext } from '../interface/context/i-error-application.context';

export const createApplicationContext = (
  operation: string,
  params?: {
    actorId?: string;
    resourceTargetId?: string;
    resourceType?: string;
    [key: string]: unknown;
  },
): IApplicationErrorContext => {
  return {
    operation,
    actorId: params?.actorId,
    resourceTargetId: params?.resourceTargetId,
    resourceType: params?.resourceType,
    ...(params ?? {}),
  };
};
