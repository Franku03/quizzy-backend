/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\entities\slides\kahoot.slide.single-choice.ts

// --- Externals & Core ---
import { Either, ErrorData } from 'src/core/types';

// --- Domain Models, Rules & Base ---
import { SlideId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.slide.id';
import { SLIDE_POINTS_STD } from '../../constants/kahoot.slide.rules';
import { Slide, SlideProps } from './kahoot.slide';
import {
  SlideType,
  SlideTypeEnum,
} from '../../value-objects/kahoot.slide.type';

// --- Strategies & Shared ---
import { EvaluationStrategy } from '../../helpers/i-evalutaion.strategy';
import { TestKnowledgeEvaluationStrategy } from '../../helpers/test-knowledge.strategy';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

export class SingleChoiceSlide extends Slide {
  private constructor(props: SlideProps, id: SlideId) {
    super(props, id);
  }

  private getSlideContext(operation: string) {
    return createDomainContext('SingleChoiceSlide', operation, {
      domainObjectKind: 'Entity',
      domainObjectId: this.id.value,
    });
  }

  public static create(
    props: SlideProps,
    id: SlideId,
  ): Either<ErrorData, SingleChoiceSlide> {
    const typeResult = SlideType.create(SlideTypeEnum.SINGLE);
    if (typeResult.isLeft()) return Either.makeLeft(typeResult.getLeft());

    props.slideType = typeResult.getRight();
    props.evalStrategy = new TestKnowledgeEvaluationStrategy();

    const baseResult = Slide.checkBaseInvariants(props, SlideTypeEnum.SINGLE);
    if (baseResult.isLeft()) return Either.makeLeft(baseResult.getLeft());

    const instance = new SingleChoiceSlide(props, id);
    return instance.checkInitialInvariants().map(() => instance);
  }

  protected checkInitialInvariants(): Either<ErrorData, void> {
    const context = this.getSlideContext('checkInitialInvariants');
    const pointsOptional = this.properties.points;

    if (!pointsOptional.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { points: ['REQUIRED'] },
          'Points are mandatory for Single Choice slides.',
        ),
      );
    }

    const pointValue = pointsOptional.getValue().value;
    if (!SLIDE_POINTS_STD.includes(pointValue)) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { points: ['INVALID_VALUE'] },
          `Point value (${pointValue}) is not allowed. Must be: ${SLIDE_POINTS_STD.join(', ')}.`,
        ),
      );
    }

    if (this.properties.description.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { description: ['NOT_ALLOWED'] },
          'Single Choice slides do not support descriptions.',
        ),
      );
    }

    const optionsOptional = this.properties.options;
    if (optionsOptional.hasValue()) {
      const optionsArray = optionsOptional.getValue();
      if (optionsArray.length > 6) {
        return Either.makeLeft(
          DomainErrorFactory.validation(
            context,
            { options: ['LIMIT_EXCEEDED'] },
            'Single Choice slides cannot exceed 6 options.',
          ),
        );
      }
    }

    return Either.makeRight(undefined);
  }

  public getMaxOptions(): number {
    return 6;
  }

  public changeEvaluationStrategy(
    newStrategy: EvaluationStrategy,
  ): Either<ErrorData, void> {
    this.properties.evalStrategy = newStrategy;
    return Either.makeRight(undefined);
  }

  public validatePublishingInvariants(): Either<ErrorData, void> {
    const context = this.getSlideContext('validatePublishing');
    const optionsArray = this.getOptionsList();
    const correctOptionsCount = optionsArray.filter((o) => o.isCorrect).length;

    if (!this.properties.question.hasValue()) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { question: ['REQUIRED'] },
          'Single Choice slide must have a title.',
        ),
      );
    }
    if (optionsArray.length < 2) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { options: ['TOO_FEW_OPTIONS'] },
          'Single Choice slide must have between 2 and 6 options.',
        ),
      );
    }

    if (correctOptionsCount < 1) {
      return Either.makeLeft(
        DomainErrorFactory.validation(
          context,
          { options: ['NO_CORRECT_OPTION'] },
          'Single Choice slide must have at least one (1) correct option.',
        ),
      );
    }

    return Either.makeRight(undefined);
  }
}
