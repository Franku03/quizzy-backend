import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules"; 
import { Slide, SlideProps } from "./kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType, SlideTypeEnum } from '../value-objects/kahoot.slide.type'; 

export class TrueFalseSlide extends Slide { 
    
    public constructor(props: SlideProps, id: SlideId) {
         
        props.slideType = new SlideType(SlideTypeEnum.TRUE_FALSE); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy(); 
        
        super(props, id);

        this.checkInitialInvariants();
    }
    
    protected checkInitialInvariants(): void {
        const pointsOptional = this.properties.points; 
        
        if (!pointsOptional || !pointsOptional.hasValue()) { 
            throw new Error("[Constructor] Slide True/False: Los puntos son obligatorios.");
        }
        
        const pointValue = pointsOptional.getValue().value; 
        if (!SLIDE_POINTS_STD.includes(pointValue)) {
            throw new Error(`[Constructor] Slide True/False: El valor de puntos (${pointValue}) no es permitido. Debe ser ${SLIDE_POINTS_STD.join(', ')}.`);
        }
        
        // Validación de Opciones: Número fijo 
        const optionsOptional = this.properties.options;
        if (!optionsOptional || !optionsOptional.hasValue() || optionsOptional.getValue().length !== 2) {
             throw new Error("[Constructor] Slide True/False: Debe ser inicializado con exactamente dos opciones.");
        }

        if (this.properties.description && this.properties.description.hasValue()) { 
            throw new Error("[Constructor] Slide True/False: no deben tener descripción.");
        }
    }

    public getMaxOptions(): number {
        return 2;
    }
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        this.properties.evalStrategy = newStrategy;
    }

    public validatePublishingInvariants(): void {
        const optionsArray = this.getOptionsList();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;

        if(!this.properties.question.hasValue()){
            throw new Error("Slide True/False: Debe tener titulo");
        }
        
        if (correctOptionsCount !== 1) {
            throw new Error("Slide True/False: Debe tener exactamente una (1) opción correcta.");
        }
    }
}