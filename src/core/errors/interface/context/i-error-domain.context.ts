/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\errors\interface\context\i-error-domain.context.ts

import { IErrorContext } from './i-error-context.interface';

export interface IDomainErrorContext extends IErrorContext {
  // TÉCNICO: Qué clase falló? (Ej: 'VisibilityStatus')
  domainObjectType: string;

  // TÉCNICO: Qué nivel es? (Ej: 'ValueObject')
  domainObjectKind?:
    | 'ValueObject'
    | 'Entity'
    | 'AggregateRoot'
    | 'DomainService';

  // TÉCNICO: ID del objeto que falló (Si es una Slide, su ID. Si es un VO, vacío)
  domainObjectId?: string;

  // NEGOCIO: El nombre del Agregado (Ej: 'Kahoot')
  rootAggregateName?: string;

  // NEGOCIO: El ID del Agregado (El UUID del Kahoot)
  rootAggregateId?: string;
}
