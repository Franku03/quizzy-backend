import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_MULTIPLE } from "../constants/kahoot.slide.rules";
import { Slide, SlideProps } from "./kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType, SlideTypeEnum } from '../value-objects/kahoot.slide.type';

export class MultipleChoiceSlide extends Slide {
    
    public constructor(props: SlideProps, id: SlideId) {
        
        props.slideType = new SlideType(SlideTypeEnum.MULTIPLE); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();
        
        super(props, id); 

        this.checkInitialInvariants();
    }

    protected checkInitialInvariants(): void {
        const pointsOptional = this.properties.points; 
        
        if (pointsOptional && pointsOptional.hasValue()) { 
            const pointsVO = pointsOptional.getValue();
            const pointValue = pointsVO.value; 

            if (!SLIDE_POINTS_MULTIPLE.includes(pointValue)) {
                throw new Error(`[Constructor] Slide Multiple: El valor de puntos (${pointValue}) no es permitido. Los valores válidos son: ${SLIDE_POINTS_MULTIPLE.join(', ')}.`);
            }
        }

        if (this.properties.description && this.properties.description.hasValue()) { 
            throw new Error("[Constructor] Slide Multiple: Las diapositivas de opción múltiple no deben tener descripción.");
        }
        
        const optionsOptional = this.properties.options;
        if (optionsOptional && optionsOptional.hasValue()) { 
            const optionsArray = optionsOptional.getValue();
            if (optionsArray.length > 6) { 
                throw new Error("[Constructor] Slide Multiple: No puede exceder 6 opciones.");
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
        const optionsArray = this.getOptionsList()
        const correctOptionsCount = optionsArray.filter(o => o.isCorrect).length;
        
        if(!this.properties.question.hasValue()){
            throw new Error("Slide Multiple: Debe tener titulo");
        }
    
        if (optionsArray.length < 2) { 
            throw new Error("Slide Multiple: Debe tener entre 2 y 6 opciones.");
        }
        
        if (correctOptionsCount < 1) {
            throw new Error("Slide Multiple: Debe tener al menos una (1) opción correcta.");
        }
    
    }
}