/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\core\domain\shared-value-objects\value-objects\value.object.points.ts

import { Either, ErrorData } from 'src/core/types';
import { ValueObject } from 'src/core/domain/abstractions/value.object';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

export enum PointsEnum {
  CERO_POINTS = 0,
  FIVE_HUNDRED_POINTS = 500,
  THOUSAND_POINTS = 1000,
  TWO_THOUSAND_POINTS = 2000,
}

interface PointsProps {
  readonly value: number;
}

export class Points extends ValueObject<PointsProps> {
  public constructor(points: number) {
    super({ value: points });
  }

  public static create(points: number): Either<ErrorData, Points> {
    const domainContext = createDomainContext('Points', 'ValueObject');

    if (!Number.isInteger(points) || points < 0) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          domainContext,
          { value: ['MUST_BE_NON_NEGATIVE_INTEGER'] },
          'Points must be a non-negative integer.',
        ),
      );
    }

    if (!Object.values(PointsEnum).includes(points)) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          domainContext,
          { value: ['INVALID_POINTS_VALUE'] },
          `The points value (${points}) is not allowed.`,
        ),
      );
    }

    return Either.makeRight(new Points(points));
  }

  public get value(): number {
    return this.properties.value;
  }
}
