/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\entities\slides\kahoot.slide.display-slide.ts

// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";

// --- Domain Models, Rules & Base ---
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Slide, SlideProps } from "./kahoot.slide";
import { SlideType, SlideTypeEnum } from "../../value-objects/kahoot.slide.type";

// --- Strategies & Shared ---
import { EvaluationStrategy } from "../../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../../helpers/test-knowledge.strategy";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class DisplaySlide extends Slide {

    private constructor(props: SlideProps, id: SlideId) {
        super(props, id);
    }

    private getSlideContext(operation: string) {
        return createDomainContext('DisplaySlide', operation, {
            domainObjectKind: 'Entity',
            domainObjectId: this.id.value
        });
    }

    public static create(props: SlideProps, id: SlideId): Either<ErrorData, DisplaySlide> {
        // 1. Validamos el tipo usando el Factory del Value Object
        const typeResult = SlideType.create(SlideTypeEnum.SLIDE);
        if (typeResult.isLeft()) return Either.makeLeft(typeResult.getLeft());

        // 2. Asignación directa de propiedades
        props.slideType = typeResult.getRight();
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();

        // 3. Verificamos los invariantes de la clase base
        const baseResult = Slide.checkBaseInvariants(props, SlideTypeEnum.SLIDE);
        if (baseResult.isLeft()) return Either.makeLeft(baseResult.getLeft());

        // 4. Creamos la instancia y ejecutamos las validaciones finales
        const instance = new DisplaySlide(props, id);
        return instance.checkInitialInvariants().map(() => instance);
    }
    
    protected checkInitialInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('checkInitialInvariants');

        const pointsOptional = this.properties.points;
        if (pointsOptional && pointsOptional.hasValue()) {
            const pointValue = pointsOptional.getValue().value;

            if (pointValue !== 0) {
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { points: ['MUST_BE_ZERO'] }, "Display slides must have 0 points."
                ));
            }
        }

        const optionsOptional = this.properties.options;
        if (optionsOptional && optionsOptional.hasValue()) {
            if (optionsOptional.getValue().length > 0) {
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { options: ['NOT_ALLOWED'] }, "Display slides cannot have options."
                ));
            }
        }

        return Either.makeRight(undefined);
    }

    public getMaxOptions(): number {
        return 0;
    }

    public validatePublishingInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('validatePublishing');

        if (!this.properties.question.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { question: ['REQUIRED'] }, "Display slide must have a title."
            ));
        }

        if (!this.properties.description.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { description: ['REQUIRED'] }, "Display slide must have a description."
            ));
        }

        return Either.makeRight(undefined);
    }

    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): Either<ErrorData, void> {
        return Either.makeLeft(DomainErrorFactory.validation(
            this.getSlideContext('changeEvaluationStrategy'),
            { strategy: ['OPERATION_NOT_SUPPORTED'] },
            "Display slides do not support evaluation strategies."
        ));
    }
}