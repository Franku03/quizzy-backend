import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { SLIDE_POINTS_MULTIPLE } from "../constants/kahoot.slide.rules";
import { SlideTypeEnum, Slide, SlideProps } from "../entities/kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType } from '../value-objects/kahoot.slide.type';

export class MultipleChoiceSlide extends Slide {
    public constructor(props: SlideProps, id: SlideId) {
        props.slideType = new SlideType(SlideTypeEnum.MULTIPLE);
        props.evalStrategy = new TestKnowledgeEvaluationStrategy();
        super(props, id);  
    }

    public getMaxOptions(): number {
        return 6; 
    }
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        this.properties.evalStrategy = newStrategy;
    }

    //Invariante que solo debe cumplirse si isPublishable 
    public validatePublishingInvariants(): void {
        const optionsArray = this.getOptionsList()
        const correctOptionsCount = optionsArray.filter(o => o.isCorrectAnswer()).length;
        
        if(!this.properties.question.hasValue()){
            throw new Error("Quiz Multiple: Debe tener titulo");
        }
        if (optionsArray.length < 2 || optionsArray.length > 6) {
            throw new Error("Quiz Múltiple: Debe tener entre 2 y 6 opciones.");
        }
        if (correctOptionsCount < 1) {
            throw new Error("Quiz Múltiple: Debe tener al menos una (1) opción correcta.");
        }

        if (!SLIDE_POINTS_MULTIPLE.includes(this.getPoints().getValue().value)) {
            throw new Error("Quiz Múltiple: Los puntos deben ser 0, 500 o 1000.");
        }
    }
}