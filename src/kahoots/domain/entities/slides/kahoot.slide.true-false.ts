/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\entities\slides\kahoot.slide.true-false.ts

// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";

// --- Domain Models, Rules & Base ---
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_STD } from "../../constants/kahoot.slide.rules";
import { Slide, SlideProps } from "./kahoot.slide";
import { SlideType, SlideTypeEnum } from '../../value-objects/kahoot.slide.type';

// --- Strategies & Shared ---
import { EvaluationStrategy } from "../../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../../helpers/test-knowledge.strategy";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class TrueFalseSlide extends Slide {

    private constructor(props: SlideProps, id: SlideId) {
        super(props, id);
    }

    private getSlideContext(operation: string) {
        return createDomainContext('TrueFalseSlide', operation, {
            domainObjectKind: 'Entity',
            domainObjectId: this.id.value
        });
    }

    public static create(props: SlideProps, id: SlideId): Either<ErrorData, TrueFalseSlide> {
        const typeResult = SlideType.create(SlideTypeEnum.TRUE_FALSE);
        if (typeResult.isLeft()) return Either.makeLeft(typeResult.getLeft());

        props.slideType = typeResult.getRight();
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();

        const baseResult = Slide.checkBaseInvariants(props, SlideTypeEnum.TRUE_FALSE);
        if (baseResult.isLeft()) return Either.makeLeft(baseResult.getLeft());

        const instance = new TrueFalseSlide(props, id);
        return instance.checkInitialInvariants().map(() => instance);
    }

    protected checkInitialInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('checkInitialInvariants');
        const pointsOptional = this.properties.points;

        if (!pointsOptional || !pointsOptional.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { points: ['REQUIRED'] }, "Points are mandatory for True/False slides."
            ));
        }

        const pointValue = pointsOptional.getValue().value;
        if (!SLIDE_POINTS_STD.includes(pointValue)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { points: ['INVALID_VALUE'] },
                `Point value (${pointValue}) is not allowed. Must be: ${SLIDE_POINTS_STD.join(', ')}.`
            ));
        }

        const optionsOptional = this.properties.options;
        if (!optionsOptional || !optionsOptional.hasValue() || optionsOptional.getValue().length !== 2) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { options: ['INVALID_COUNT'] }, "True/False slides must be initialized with exactly two options."
            ));
        }

        if (this.properties.description && this.properties.description.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { description: ['NOT_ALLOWED'] }, "True/False slides do not support descriptions."
            ));
        }

        return Either.makeRight(undefined);
    }

    public getMaxOptions(): number {
        return 2;
    }

    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): Either<ErrorData, void> {
        this.properties.evalStrategy = newStrategy;
        return Either.makeRight(undefined);
    }

    public validatePublishingInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('validatePublishing');
        const optionsArray = this.getOptionsList();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrect).length;

        if (!this.properties.question.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { question: ['REQUIRED'] }, "True/False slide must have a title."
            ));
        }

        if (correctOptionsCount !== 1) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { options: ['INVALID_CORRECT_COUNT'] }, "True/False slide must have exactly one (1) correct option."
            ));
        }

        return Either.makeRight(undefined);
    }
}