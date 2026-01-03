// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";

// --- Domain Models, Rules & Base ---
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_MULTIPLE } from "../../constants/kahoot.slide.rules";
import { Slide, SlideProps } from "./kahoot.slide";
import { SlideType, SlideTypeEnum } from '../../value-objects/kahoot.slide.type';

// --- Strategies & Shared ---
import { EvaluationStrategy } from "../../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../../helpers/test-knowledge.strategy";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class MultipleChoiceSlide extends Slide {
    
    private constructor(props: SlideProps, id: SlideId) {
        super(props, id); 
    }

    private getSlideContext(operation: string) {
        return createDomainContext('MultipleChoiceSlide', operation, {
            domainObjectKind: 'Entity',
            domainObjectId: this.id.value
        });
    }

    public static create(props: SlideProps, id: SlideId): Either<ErrorData, MultipleChoiceSlide> {
        props.slideType = new SlideType(SlideTypeEnum.MULTIPLE); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();

        return Slide.checkBaseInvariants(props, 'MultipleChoiceSlide')
            .chain(() => {
                const instance = new MultipleChoiceSlide(props, id);
                return instance.checkInitialInvariants()
                    .map(() => instance);
            });
    }

    protected checkInitialInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('checkInitialInvariants');
        const pointsOptional = this.properties.points; 
        
        if (pointsOptional && pointsOptional.hasValue()) { 
            const pointsVO = pointsOptional.getValue();
            const pointValue = pointsVO.value; 

            if (!SLIDE_POINTS_MULTIPLE.includes(pointValue)) {
                return Either.makeLeft(DomainErrorFactory.validation(
                    context,
                    { points: ['INVALID_VALUE'] },
                    `Point value (${pointValue}) is not allowed. Valid values: ${SLIDE_POINTS_MULTIPLE.join(', ')}.`
                ));
            }
        }

        if (this.properties.description && this.properties.description.hasValue()) { 
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { description: ['NOT_ALLOWED'] },
                "Multiple choice slides do not support descriptions."
            ));
        }
        
        const optionsOptional = this.properties.options;
        if (optionsOptional && optionsOptional.hasValue()) { 
            const optionsArray = optionsOptional.getValue();
            if (optionsArray.length > 6) { 
                return Either.makeLeft(DomainErrorFactory.validation(
                    context,
                    { options: ['LIMIT_EXCEEDED'] },
                    "Multiple choice slides cannot exceed 6 options."
                ));
            }
        }

        return Either.makeRight(undefined);
    }

    public getMaxOptions(): number {
        return 6; 
    }

    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): Either<ErrorData, void> {
        this.properties.evalStrategy = newStrategy;
        return Either.makeRight(undefined);
    }

    public validatePublishingInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('validatePublishing');
        const optionsArray = this.getOptionsList();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrect).length;
        
        if(!this.properties.question.hasValue()){
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { question: ['REQUIRED'] }, "Multiple choice slide must have a title."
            ));
        }
    
        if (optionsArray.length < 2) { 
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { options: ['TOO_FEW_OPTIONS'] }, "Multiple choice slide must have between 2 and 6 options."
            ));
        }
        
        if (correctOptionsCount < 1) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { options: ['NO_CORRECT_OPTION'] }, "Multiple choice slide must have at least one (1) correct option."
            ));
        }

        return Either.makeRight(undefined);
    }
}