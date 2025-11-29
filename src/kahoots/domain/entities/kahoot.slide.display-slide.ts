import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SlideTypeEnum, Slide, SlideProps } from "./kahoot.slide";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType } from "../value-objects/kahoot.slide.type";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { MAX_DESCRIPTION_LENGTH } from "../constants/kahoot.rules";

// Clase que implementa la lógica de visualización
export class DisplaySlide extends Slide {
    
    private readonly description: string; 

    public constructor(props: SlideProps, id: SlideId) {
        props.slideType = new SlideType(SlideTypeEnum.SLIDE);
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();
        super(props, id); 
    }
    public getMaxOptions(): number {
        return 0; // Un slide de visualización no tiene opciones.
    }
    public validatePublishingInvariants(): void {
        const optionsArray = this.getOptionsList();
        if(!this.properties.question.hasValue()){
            throw new Error("Quiz Multiple: Debe tener titulo");
        }
        if (optionsArray.length > 0) {
            throw new Error("Slide (Display): Las diapositivas de visualización no deben tener opciones.");
        }
        if (this.getPoints().hasValue() && this.getPoints().getValue().value !== 0) {
            throw new Error("Slide (Display): Las diapositivas de visualización siempre deben tener 0 puntos.");
        }
    }
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        throw new Error("No se puede cambiar la estrategia de un slide de visualización.");
    }
    
    public getDescription(): string {
        return this.description;
    }
}