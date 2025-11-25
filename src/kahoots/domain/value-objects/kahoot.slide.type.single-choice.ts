import { SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { QuizTypeEnum, SlideType } from "./kahoot.slide.type.abstract";

export class SingleChoiceType extends SlideType {
    public constructor(evalStrategy: EvaluationStrategy) {
        super(QuizTypeEnum.SINGLE, evalStrategy);
    }
    
    public validateInvariants(slide: Slide): void {
        const optionsArray = slide.getOptions();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;
        
        if (optionsArray.length < 2 || optionsArray.length > 6) {
            throw new Error("Quiz Single: Debe tener entre 2 y 6 opciones.");
        }
        if (correctOptionsCount < 1) {
            throw new Error("Quiz Single: Debe tener al menos una (1) opción correcta.");
        }
        if (!slide.getPoints().hasValue() || !SLIDE_POINTS_STD.includes(slide.getPoints().getValue().value)) {
            throw new Error("Quiz Single: Los puntos deben ser 0, 1000 o 2000.");
        }
    }

    public getMaxOptions(): number {
        return 6;   
    }
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType {
        return new SingleChoiceType(newStrategy); 
    }
}