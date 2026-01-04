// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";

// --- Domain Models, Rules & Base ---
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { MAX_OPTION_CHARS_TYPEANSWER, SLIDE_POINTS_STD } from "../../constants/kahoot.slide.rules";
import { Slide, SlideProps } from "./kahoot.slide";
import { SlideType, SlideTypeEnum } from '../../value-objects/kahoot.slide.type'; 

// --- Strategies & Shared ---
import { EvaluationStrategy } from "../../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../../helpers/test-knowledge.strategy";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export class ShortAnswerSlide extends Slide { 
    
    private constructor(props: SlideProps, id: SlideId) {
        super(props, id);
    }

    private getSlideContext(operation: string) {
        return createDomainContext('ShortAnswerSlide', operation, {
            domainObjectKind: 'Entity',
            domainObjectId: this.id.value
        });
    }

    public static create(props: SlideProps, id: SlideId): Either<ErrorData, ShortAnswerSlide> {
        props.slideType = new SlideType(SlideTypeEnum.SHORT_ANSWER); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy(); 

        return Slide.checkBaseInvariants(props, 'ShortAnswerSlide')
            .chain(() => {
                const instance = new ShortAnswerSlide(props, id);
                return instance.checkInitialInvariants()
                    .map(() => instance);
            });
    }
    
    protected checkInitialInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('checkInitialInvariants');
        const pointsOptional = this.properties.points; 
        
        if (!pointsOptional || !pointsOptional.hasValue()) { 
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { points: ['REQUIRED'] }, "Points are mandatory for Short Answer slides."
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
        
        if (this.properties.description && this.properties.description.hasValue()) { 
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { description: ['NOT_ALLOWED'] }, "Short Answer slides do not support descriptions."
            ));
        }
        
        const optionsOptional = this.properties.options;
        const maxOption = this.getMaxOptions();
        
        if (optionsOptional && optionsOptional.hasValue()) { 
            const optionsArray = optionsOptional.getValue();
            
            if (optionsArray.length > maxOption) { 
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { options: ['LIMIT_EXCEEDED'] }, `Short Answer slides cannot exceed ${maxOption} correct answers.`
                ));
            }

            const invalidOption = optionsArray.find(o => 
                !o.isWithinLengthLimit(MAX_OPTION_CHARS_TYPEANSWER) || 
                !o.hasText() || 
                o.hasImage()
            );

            if (invalidOption) {
                if (!invalidOption.isWithinLengthLimit(MAX_OPTION_CHARS_TYPEANSWER)) {
                    return Either.makeLeft(DomainErrorFactory.validation(
                        context, { options: ['TOO_LONG'] }, `A short answer cannot exceed ${MAX_OPTION_CHARS_TYPEANSWER} characters.`
                    ));
                }
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { options: ['INVALID_FORMAT'] }, "Each answer must be text-only and cannot contain an image."
                ));
            }

            const incorrectOptionsCount = optionsArray.filter(o => !o.isCorrect).length;
            if (incorrectOptionsCount > 0) {
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { options: ['MUST_BE_CORRECT'] }, "All options in a Short Answer slide must be marked as correct."
                ));
            }
        }

        return Either.makeRight(undefined);
    }
    
    public getMaxOptions(): number {
        return 4; 
    } 
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): Either<ErrorData, void> {
        this.properties.evalStrategy = newStrategy;
        return Either.makeRight(undefined);
    }

    public validatePublishingInvariants(): Either<ErrorData, void> {
        const context = this.getSlideContext('validatePublishing');
        const optionsArray = this.getOptionsList();
    
        if(!this.properties.question.hasValue()){
             return Either.makeLeft(DomainErrorFactory.validation(
                context, { question: ['REQUIRED'] }, "Short Answer slide must have a title."
             ));
        }
        
        if (optionsArray.length < 1) { 
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { options: ['TOO_FEW_OPTIONS'] }, `Short Answer slide must have between 1 and ${this.getMaxOptions()} correct answers.`
            ));
        }

        return Either.makeRight(undefined);
    }
}