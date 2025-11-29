import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Option } from "../value-objects/kahoot.slide.option";

export enum QuizTypeEnum {
    SINGLE = "SINGLE",
    MULTIPLE = "MULTIPLE",
    TRUE_FALSE = "TRUE_FALSE",
    SHORT_ANSWER = "SHORT_ANSWER",
    POLL = "POLL",
    SLIDE = "SLIDE" 
}

interface SlideTypeProps {
    readonly type: QuizTypeEnum;
    readonly evalStrategy: EvaluationStrategy;
}


export abstract class SlideType extends ValueObject<SlideTypeProps> {

    protected constructor(type: QuizTypeEnum, evalStrategy: EvaluationStrategy) {
        
        if (!Object.values(QuizTypeEnum).includes(type)) {
            throw new Error(`El tipo de quiz '${type}' no es válido.`);
        }
        super({ type, evalStrategy });
    }

    public abstract validateInvariants(slide: Slide): void;

    public abstract changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType 

   

    public evaluateAnswer(submission: Submission ): Result {
        return this.properties.evalStrategy.evaluateAnswer(submission,[]);
    }
    
    public getType(): QuizTypeEnum { 
        return this.properties.type; 
    }
}