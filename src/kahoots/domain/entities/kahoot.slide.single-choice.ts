import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules"; 
import { Slide, SlideProps } from "./kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType, SlideTypeEnum } from '../value-objects/kahoot.slide.type'; 

export class SingleChoiceSlide extends Slide { 
    
    public constructor(props: SlideProps, id: SlideId) {
        
        SingleChoiceSlide.checkInitialInvariants(props);
        
        props.slideType = new SlideType(SlideTypeEnum.SINGLE); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy(); 
        
        super(props, id);
    }
    
    public static checkInitialInvariants(props: SlideProps): void {
        const pointsOptional = props.points; 
        
        // Validación de Puntos: Obligatorio y dentro del rango SLIDE_POINTS_STD
        if (!pointsOptional || !pointsOptional.hasValue()) { 
            throw new Error("[Constructor] Slide Single Choice: Los puntos son obligatorios.");
        }
        
        const pointValue = pointsOptional.getValue().value; 
        if (!SLIDE_POINTS_STD.includes(pointValue)) {
            throw new Error(`[Constructor] Slide Single Choice: El valor de puntos (${pointValue}) no es permitido. Debe ser ${SLIDE_POINTS_STD.join(', ')}.`);
        }
        
        // Validación de Descripción: No debe tener descripción
        if (props.description && props.description.hasValue()) { 
            throw new Error("[Constructor] Slide Single Choice: Las diapositivas de opción única no deben tener descripción.");
        }

        // Límite superior (6)
        const optionsOptional = props.options;
        if (optionsOptional && optionsOptional.hasValue()) { 
            const optionsArray = optionsOptional.getValue();
            if (optionsArray.length > 6) { 
                throw new Error("[Constructor] Slide Single Choice: No puede exceder 6 opciones.");
            }
        }
    }
    
    public getMaxOptions(): number {
        return 6; 
    } 
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        this.properties.evalStrategy = newStrategy;
    }

    public validatePublishingInvariants(): void {
        const optionsArray = this.getOptionsList();
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;
        
        if(!this.properties.question.hasValue()){
            throw new Error("Slide Single Choice: Debe tener título.");
        }
        if (optionsArray.length < 2) { 
            throw new Error("Slide Single Choice: Debe tener entre 2 y 6 opciones.");
        }
        
        if (correctOptionsCount < 1) { 
            throw new Error("Slide Single Choice: Debe tener al menos una (1) opción correcta.");
        } 
    }
}