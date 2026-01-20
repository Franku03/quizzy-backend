/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.slide.description.ts

// --- Externals & Core ---
import { Either, ErrorData } from 'src/core/types';
import { ValueObject } from 'src/core/domain/abstractions/value.object';

// --- Domain Models & Rules ---
import { MAX_DESCRIPTION_LENGTH } from '../constants/kahoot.rules';

// --- Shared Errors & Context ---
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

interface DescriptionProps {
  readonly description: string;
}

export class Description extends ValueObject<DescriptionProps> {
  private constructor(text: string) {
    super({ description: text });
  }

  public static create(text: string): Either<ErrorData, Description> {
    const context = createDomainContext('Description', 'validateDescription', {
      domainObjectKind: 'ValueObject',
    });

    const cleanText = text ? text.trim() : '';

    if (cleanText.length === 0) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { description: ['EMPTY_DESCRIPTION'] },
          'Description cannot be empty.',
        ),
      );
    }

    if (cleanText.length > MAX_DESCRIPTION_LENGTH) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { description: ['TOO_LONG'] },
          `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        ),
      );
    }

    return Either.makeRight(new Description(cleanText));
  }

  public get description(): string {
    return this.properties.description;
  }
}
