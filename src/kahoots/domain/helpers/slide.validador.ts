import { SlideProps } from "../entities/kahoot.slide";
import { SlideType, SlideTypeEnum } from "../value-objects/kahoot.slide.type";
import { DisplaySlide } from "../entities/kahoot.slide.display-slide"; 
import { SingleChoiceSlide } from "../entities/kahoot.slide.single-choice";
import { MultipleChoiceSlide } from "../entities/kahoot.slide.multiple-choise";
import { ShortAnswerSlide } from "../entities/kahoot.slide.short-answer";
import { TrueFalseSlide } from "../entities/kahoot.slide.true-false";

export class SlideTypeValidator {
    public static validatePropsForNewType(newType: SlideType, props: SlideProps): void {
        
        switch (newType.getType()) {
            case SlideTypeEnum.SLIDE:
                DisplaySlide.checkInitialInvariants(props);
                break;
            case SlideTypeEnum.SINGLE:
                SingleChoiceSlide.checkInitialInvariants(props);
                break;
            case SlideTypeEnum.MULTIPLE:
                MultipleChoiceSlide.checkInitialInvariants(props);
                break;
            case SlideTypeEnum.SHORT_ANSWER:
                ShortAnswerSlide.checkInitialInvariants(props);
                break;
            case SlideTypeEnum.TRUE_FALSE:
                TrueFalseSlide.checkInitialInvariants(props);
                break;
            default:
                throw new Error(`[SlideTypeValidator] Tipo de Slide no soportado: ${newType.getType()}`);
        }
    }
}