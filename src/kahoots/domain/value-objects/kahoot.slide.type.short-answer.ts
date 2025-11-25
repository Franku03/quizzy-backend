import { MAX_OPTION_CHARS_TYPEANSWER, SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { QuizTypeEnum, SlideType } from "./kahoot.slide.type.abstract";

export class ShortAnswerType extends SlideType {
    public constructor(evalStrategy: EvaluationStrategy) {
        super(QuizTypeEnum.SHORT_ANSWER, evalStrategy);
    }

    public validateInvariants(slide: Slide): void {
        const optionsArray = slide.getOptions();
        
        if (optionsArray.length < 1 || optionsArray.length > 4) {
            throw new Error("ShortAnswer: Debe tener entre 1 y 4 opciones (respuestas aceptadas).");
        }
        
        if (optionsArray.length < 1) {
             throw new Error("ShortAnswer: Debe tener al menos una (1) respuesta aceptada.");
        }

        const invalidOption = optionsArray.find(o => o.getText().length > MAX_OPTION_CHARS_TYPEANSWER);
        if (invalidOption) {
            throw new Error(`ShortAnswer: Cada respuesta aceptada no puede exceder ${MAX_OPTION_CHARS_TYPEANSWER} caracteres.`);
        }

        if (!slide.getPoints().hasValue() || !SLIDE_POINTS_STD.includes(slide.getPoints().getValue().value)) {
            throw new Error("ShortAnswer: Los puntos deben ser 0, 1000 o 2000.");
        }
    }
    
    public getMaxOptions(): number {
        return 4; 
    }   
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType {
        return new ShortAnswerType(newStrategy); 
    }
}