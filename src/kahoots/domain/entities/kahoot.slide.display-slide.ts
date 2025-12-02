import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Slide, SlideProps } from "./kahoot.slide";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType, SlideTypeEnum } from "../value-objects/kahoot.slide.type";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";

export class DisplaySlide extends Slide {

    public constructor(props: SlideProps, id: SlideId) {
        
        props.slideType = new SlideType(SlideTypeEnum.SLIDE);
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();
        
        super(props, id);
        
        this.checkInitialInvariants();
    }
    
    protected checkInitialInvariants(): void {
        
        const pointsOptional = this.properties.points;
        if (pointsOptional && pointsOptional.hasValue()) { 
            const pointValue = pointsOptional.getValue().value;
            
            if (pointValue !== 0) {
                 throw new Error("[Constructor] Slide (Display): deben tener 0 puntos.");
            }
        }

        const optionsOptional = this.properties.options;
        if (optionsOptional && optionsOptional.hasValue()) { 
            if (optionsOptional.getValue().length > 0) {
                throw new Error("[Constructor] Slide (Display): no deben tener opciones.");
            }
        }
    }
    
    public getMaxOptions(): number {
        return 0;
    }
    
    public validatePublishingInvariants(): void {
        
        if(!this.properties.question.hasValue()){
            throw new Error("Slide (Display): Debe tener título");
        }
        
        if(!this.properties.description.hasValue()){
            throw new Error("Slide (Display): Debe tener descripcion");

        }
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        throw new Error("No se puede cambiar la estrategia de un slide de visualización.");
    }
}