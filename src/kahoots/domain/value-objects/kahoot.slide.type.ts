/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.slide.type.ts

// --- Externals & Core ---
import { Either, ErrorData } from 'src/core/types';
import { ValueObject } from 'src/core/domain/abstractions/value.object';

// --- Domain Models & Rules ---
import {
  MAX_OPTION_CHARS_TYPEANSWER,
  MAX_OPTION_TEXT_LENGTH,
} from '../constants/kahoot.slide.rules';

// --- Shared Errors & Context ---
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';
import { IDomainErrorContext } from 'src/core/errors/interface/context/i-error-domain.context';

export enum SlideTypeEnum {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  SLIDE = 'SLIDE',
}

interface SlideTypeProps {
  readonly type: SlideTypeEnum;
}

export class SlideType extends ValueObject<SlideTypeProps> {
  private constructor(type: SlideTypeEnum) {
    super({ type });
  }

  public static create(rawType: string): Either<ErrorData, SlideType> {
    const context = createDomainContext('SlideType', 'validateType', {
      domainObjectKind: 'ValueObject',
    });

    if (!rawType || rawType.trim().length === 0) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { type: ['EMPTY_TYPE'] },
          'Slide type cannot be empty.',
        ),
      );
    }

    const upperCaseType = rawType.toUpperCase();

    if (
      !Object.values(SlideTypeEnum).includes(upperCaseType as SlideTypeEnum)
    ) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { type: ['INVALID_TYPE'] },
          `The slide type '${rawType}' is not a valid canonical value.`,
        ),
      );
    }

    return Either.makeRight(new SlideType(upperCaseType as SlideTypeEnum));
  }

  public get type(): SlideTypeEnum {
    return this.properties.type;
  }

  // --- Business Rules (Polymorphic checks) ---

  private getContext(operation: string): IDomainErrorContext {
    return createDomainContext('SlideType', operation, {
      domainObjectKind: 'ValueObject',
    });
  }

  public canHaveDescription(): Either<ErrorData, boolean> {
    if (this.type !== SlideTypeEnum.SLIDE) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          this.getContext('checkDescriptionSupport'),
          { type: ['DESCRIPTION_NOT_ALLOWED'] },
          `Slides of type ${this.type} do not support descriptions.`,
        ),
      );
    }
    return Either.makeRight(true);
  }

  public canHaveOption(): Either<ErrorData, boolean> {
    if (this.type === SlideTypeEnum.SLIDE) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          this.getContext('checkOptionsSupport'),
          { type: ['OPTIONS_NOT_ALLOWED'] },
          `Slides of type ${this.type} do not support options.`,
        ),
      );
    }
    return Either.makeRight(true);
  }

  public canHavePoints(): Either<ErrorData, boolean> {
    if (this.type === SlideTypeEnum.SLIDE) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          this.getContext('checkPointsSupport'),
          { type: ['POINTS_NOT_ALLOWED'] },
          `Slides of type ${this.type} do not support points.`,
        ),
      );
    }
    return Either.makeRight(true);
  }

  public canHaveOptionImage(): Either<ErrorData, boolean> {
    const invalidTypes = [
      SlideTypeEnum.SLIDE,
      SlideTypeEnum.TRUE_FALSE,
      SlideTypeEnum.SHORT_ANSWER,
    ];
    if (invalidTypes.includes(this.type)) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          this.getContext('checkOptionImageSupport'),
          { type: ['OPTION_IMAGE_NOT_ALLOWED'] },
          `Slides of type ${this.type} do not support option images.`,
        ),
      );
    }
    return Either.makeRight(true);
  }

  public getMaxSlideLength(): number {
    if (this.type === SlideTypeEnum.SHORT_ANSWER)
      return MAX_OPTION_CHARS_TYPEANSWER;
    return MAX_OPTION_TEXT_LENGTH;
  }
}
