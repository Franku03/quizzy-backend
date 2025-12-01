import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { MAX_OPTION_CHARS_TYPEANSWER, SLIDE_POINTS_STD } from "../constants/kahoot.slide.rules";
import { Slide, SlideProps } from "./kahoot.slide";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { TestKnowledgeEvaluationStrategy } from "../helpers/test-knowledge.strategy";
import { SlideType, SlideTypeEnum } from '../value-objects/kahoot.slide.type'; 

export class ShortAnswerSlide extends Slide { 
    
    public constructor(props: SlideProps, id: SlideId) {
        
        ShortAnswerSlide.checkInitialInvariants(props);
        
        props.slideType = new SlideType(SlideTypeEnum.SHORT_ANSWER); 
        props.evalStrategy = new TestKnowledgeEvaluationStrategy(); 
        
        super(props, id);
    }
    
    public static checkInitialInvariants(props: SlideProps): void {
        const pointsOptional = props.points; 
        
        // Validación de Puntos (PRESENCIA Y VALOR VÁLIDO)
        if (!pointsOptional || !pointsOptional.hasValue()) { 
            throw new Error("[Constructor] Slide ShortAnswer: Los puntos son obligatorios.");
        }
        
        const pointValue = pointsOptional.getValue().value; 
        if (!SLIDE_POINTS_STD.includes(pointValue)) {
            throw new Error(`[Constructor] Slide ShortAnswer: El valor de puntos (${pointValue}) no es permitido. Debe ser ${SLIDE_POINTS_STD.join(', ')}.`);
        }
        
        // Validación de Descripción
        if (props.description && props.description.hasValue()) { 
            throw new Error("[Constructor] Slide ShortAnswer: Slide de respuesta corta no deben tener descripción.");
        }
        
        // Validación de Opciones
        const optionsOptional = props.options;
        const maxOption = 4
        if (optionsOptional && optionsOptional.hasValue()) { 
            const optionsArray = optionsOptional.getValue();
            
            if (optionsArray.length > maxOption) { 
                throw new Error(`[Constructor] Slide ShortAnswer: No debe exceder ${maxOption} respuestas correctas.`);
            }

            const invalidOption = optionsArray.find(o => 
                o.isWithinLengthLimit(MAX_OPTION_CHARS_TYPEANSWER) || 
                o.hasText() || 
                o.hasImage()
            );

            if (invalidOption) {
                if (!invalidOption.isWithinLengthLimit(MAX_OPTION_CHARS_TYPEANSWER)) {
                    throw new Error(`[Constructor] Slide ShortAnswer: Una respuesta no puede exceder ${MAX_OPTION_CHARS_TYPEANSWER} caracteres.`);
                }
                throw new Error(`[Constructor] Slide ShortAnswer: Cada respuesta debe ser solo texto y no tener imagen.`);
            }

            const incorrectOptionsCount = optionsArray.filter(o => !o.isCorrectAnswer()).length;
            if (incorrectOptionsCount > 0) {
                throw new Error("[Constructor] Slide ShortAnswer: Todas las opciones deben estar marcadas como correctas.");
            }
        }
    }
    
    public getMaxOptions(): number {
        return 4; 
    } 
    
    public changeEvaluationStrategy(newStrategy: EvaluationStrategy): void {
        this.properties.evalStrategy = newStrategy;
    }

    public validatePublishingInvariants(): void {
        const optionsArray = this.getOptionsList();
    
        if(!this.properties.question.hasValue()){
             throw new Error("Slide ShortAnswer: Debe tener título.");
        }
        
        if (optionsArray.length < 1) { 
            throw new Error(`Slide ShortAnswer: Debe tener entre 1 y ${this.getMaxOptions()} respuestas correctas.`);
        }
    }
}