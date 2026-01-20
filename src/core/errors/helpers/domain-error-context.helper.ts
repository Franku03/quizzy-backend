/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\helpers\domain-error-context.helper.ts

import { IDomainErrorContext } from '../interface/context/i-error-domain.context';

export const createDomainContext = (
  domainObjectType: string,
  operation?: string,
  params?: {
    domainObjectId?: string;
    actorId?: string;
    domainObjectKind?:
      | 'ValueObject'
      | 'Entity'
      | 'AggregateRoot'
      | 'DomainService';
    rootAggregateName?: string;
    rootAggregateId?: string;
    [key: string]: unknown;
  },
): IDomainErrorContext => {
  return {
    operation,
    domainObjectType,
    domainObjectId: params?.domainObjectId,
    actorId: params?.actorId,
    domainObjectKind: params?.domainObjectKind,
    rootAggregateName: params?.rootAggregateName,
    rootAggregateId: params?.rootAggregateId,
    ...(params ?? {}),
  };
};
