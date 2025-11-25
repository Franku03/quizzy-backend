import { MAX_SLIDE_DESC_CHARS } from "../constants/kahoot.slide.rules";
import { Slide } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { QuizTypeEnum, SlideType } from "./kahoot.slide.type.abstract";

export class DisplaySlideType extends SlideType {
    
    private readonly description: string;

    public constructor(evalStrategy: EvaluationStrategy, description: string) {

        const cleanDescription = description ? description.trim() : "";
        if (cleanDescription.length === 0) {
            throw new Error("La descripción no puede estar vacía.");
        }
        if (cleanDescription.length > MAX_SLIDE_DESC_CHARS) {
            throw new Error(`La descripción no puede exceder los ${MAX_SLIDE_DESC_CHARS} caracteres.`);
        }
        super(QuizTypeEnum.SLIDE, evalStrategy); 
        this.description = cleanDescription;
    }
    
    public validateInvariants(slide: Slide): void {
        const optionsArray = slide.getOptions();
        
        if (optionsArray.length > 0) {
            throw new Error("Slide (Display): Las diapositivas de visualización no deben tener opciones.");
        }
        if (slide.getPoints().hasValue() && slide.getPoints().getValue().value !== 0) {
            throw new Error("Slide (Display): Las diapositivas de visualización siempre deben tener 0 puntos.");
        }
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): SlideType {
        return new DisplaySlideType(newStrategy, this.description); 
    }
    
    public getDescription(): string {
        return this.description;
    }
}