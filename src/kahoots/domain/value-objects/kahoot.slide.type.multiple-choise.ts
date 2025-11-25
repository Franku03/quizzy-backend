import { SLIDE_POINTS_MULTIPLE } from "../constants/kahoot.slide.rules";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { QuizTypeEnum, SlideType } from "./kahoot.slide.type.abstract";

export class MultipleChoiceType extends SlideType {
    public constructor(evalStrategy: EvaluationStrategy) {
        super(QuizTypeEnum.MULTIPLE, evalStrategy);
    }

    public validateInvariants(slide: Slide): void {
        const optionsArray = slide.getOptions();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;
        
        if (optionsArray.length < 2 || optionsArray.length > 6) {
            throw new Error("Quiz Múltiple: Debe tener entre 2 y 6 opciones.");
        }
        if (correctOptionsCount < 1) {
            throw new Error("Quiz Múltiple: Debe tener al menos una (1) opción correcta.");
        }

        if (!slide.getPoints().hasValue() || !SLIDE_POINTS_MULTIPLE.includes(slide.getPoints().getValue().value)) {
            throw new Error("Quiz Múltiple: Los puntos deben ser 0, 500 o 1000.");
        }
    }
    
    public getMaxOptions(): number {
        return 6; 
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType {
        return new MultipleChoiceType(newStrategy); 
    }
}