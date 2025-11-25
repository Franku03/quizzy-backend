import { SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { QuizTypeEnum, SlideType } from "./kahoot.slide.type.abstract";

export class TrueFalseType extends SlideType {
    public constructor(evalStrategy: EvaluationStrategy) {
        super(QuizTypeEnum.TRUE_FALSE, evalStrategy);
    }
    
    public validateInvariants(slide: Slide): void {
        const optionsArray = slide.getOptions();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;

        if (optionsArray.length !== 2) {
             throw new Error("True/False: Debe tener exactamente dos opciones.");
        }
        if (correctOptionsCount !== 1) {
            throw new Error("True/False: Debe tener exactamente una (1) opción correcta.");
        }
        
        if (!slide.getPoints().hasValue() || !SLIDE_POINTS_STD.includes(slide.getPoints().getValue().value)) {
            throw new Error("True/False: Los puntos deben ser 0, 1000 o 2000.");
        }
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType {
        return new TrueFalseType(newStrategy); 
    }
}