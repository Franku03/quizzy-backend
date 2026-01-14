/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\commands\context\base-kahoot-context.ts

import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
export const createKahootAppContext = (
  operation: string,
  aggregateId?: string,
  actorId?: string,
) => {
  return createDomainContext('Kahoot', operation, {
    rootAggregateName: 'Kahoot',
    rootAggregateId: aggregateId,
    actorId: actorId,
  });
};
