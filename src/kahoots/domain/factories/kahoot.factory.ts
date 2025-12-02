// NOTA: Asumimos que las interfaces de entrada y las clases base (Slide, Option, etc.) son accesibles.

import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Slide, SlideProps } from "../entities/kahoot.slide";
import { KahootStatus, KahootStatusEnum } from "../value-objects/kahoot.status";
import { VisibilityStatus, VisibilityStatusEnum } from "../value-objects/kahoot.visibility-status";
import { Kahoot } from "../aggregates/kahoot";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Optional } from "src/core/types/optional";
import { KahootProps } from "../aggregates/kahoot"
import { DisplaySlide } from "../entities/kahoot.slide.display-slide";
import { TrueFalseSlide } from "../entities/kahoot.slide.true-false";
import { SingleChoiceSlide } from "../entities/kahoot.slide.single-choice";
import { MultipleChoiceSlide } from "../entities/kahoot.slide.multiple-choise";
import { ShortAnswerSlide } from "../entities/kahoot.slide.short-answer";
import { Option } from "../value-objects/kahoot.slide.option";
import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { Question } from "../value-objects/kahoot.slide.question";
import { TimeLimitSeconds } from "src/core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "src/core/domain/shared-value-objects/value-objects/value.object.points";
import { Description } from "../value-objects/kahoot.slide.description";
import { SlideTypeEnum } from "../value-objects/kahoot.slide.type";
import { KahootStyling } from "../value-objects/kahoot.styling";
import { KahootDetails } from "../value-objects/kahoot.details";
import { ThemeId } from "../value-objects/kahoot.theme";
import { PlayNumber } from "../value-objects/kahoot.play-number";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";

// ====================================================================
// Interfaces de Entrada (Input DTOs)
// ====================================================================

export interface OptionInput {
    text: string | null; 
    mediaId: string | null;
    isCorrect?: boolean; 
}

export interface SlideInput {
    id: string;
    position: number;
    text: string | null;
    mediaId: string | null;
    type: string; // Corresponde a SlideTypeEnum
    timeLimit: number; 
    points: number | null; 
    answers?: OptionInput[] | null; 
}

export interface KahootInput {
    id: string; 
    authorId: string; 
    createdAt: string | null; 
    visibility: string; 
    status: string; 
    playCount: number; 
    themeId: string; 
    title: string | null;
    description: string | null;
    coverImageId: string | null; 
    category: string | null;
    questions?: SlideInput[] | null; 
}

// ====================================================================
// 🛠️ HELPER LOCAL: Mapeo de Constructores (DRY)
// Mantiene el mapeo fuera del cuerpo de la Factory, pero en el mismo archivo.
// ====================================================================

/**
 * Mapa estático que asocia el valor del enum (string) con la clase constructora del Slide.
 */
const SlideConstructorsMap: { [key in SlideTypeEnum]: new (props: SlideProps, id: SlideId) => Slide } = {
    [SlideTypeEnum.SINGLE]: SingleChoiceSlide,
    [SlideTypeEnum.MULTIPLE]: MultipleChoiceSlide,
    [SlideTypeEnum.TRUE_FALSE]: TrueFalseSlide,
    [SlideTypeEnum.SHORT_ANSWER]: ShortAnswerSlide,
    [SlideTypeEnum.SLIDE]: DisplaySlide,
};

/**
 * Resuelve y devuelve el constructor de la clase Slide concreto basado en el tipo.
 */
function resolveSlideConstructor(type: SlideTypeEnum): new (props: SlideProps, id: SlideId) => Slide {
    const SlideConstructor = SlideConstructorsMap[type];
    
    if (!SlideConstructor) {
        throw new Error(`Tipo de slide desconocido: ${type}`);
    }
    return SlideConstructor;
}

// ====================================================================
// Clase KahootFactory (Usando el Helper de Mapeo)
// ====================================================================

export class KahootFactory{

    private static buildOptionalVO<T>(value: T | null): Optional<T> {
        const optionalContent: T | undefined = (value !== null) ? value : undefined;
        return new Optional(optionalContent);
    }

    private static buildOption(optionInput: OptionInput): Option {
        const optionText = optionInput.text ?? "";
        const isCorrect = optionInput.isCorrect ?? false;
        
        // 💡 Lógica Consolidada (Soluciona el error de sintaxis y la repetición)
        const imageIdOrNull: ImageId | null = optionInput.mediaId
            ? new ImageId(optionInput.mediaId)
            : null;
        
        // Usamos el helper para convertir (ImageId | null) a Optional<ImageId>
        const optionImage: Optional<ImageId> = this.buildOptionalVO(imageIdOrNull); 

        return new Option(optionText, isCorrect, optionImage);
    }
    
    private static buildSlide(slideInput: SlideInput, position: number): Slide {
    
        // Asumimos que slideInput.id es string y no es null/undefined aquí
        const slideId = new SlideId(slideInput.id); 
        
        // 1. Construir Componentes y VOs (Usando buildOptionalVO para simplicidad)
        
        // === Question VO ===
        const questionVO: Optional<Question> = this.buildOptionalVO(
            (slideInput.text) ? new Question(slideInput.text) : null
        );

        const timeLimitVO = new TimeLimitSeconds(slideInput.timeLimit);
        
        // === Points VO ===
        const pointsVO: Optional<Points> = this.buildOptionalVO(
            (slideInput.points) ? new Points(slideInput.points) : null
        );
        
        // === Slide Image VO ===
        const slideImageVO: Optional<ImageId> = this.buildOptionalVO(
            (slideInput.mediaId) ? new ImageId(slideInput.mediaId) : null
        ); 
        
        // 2. Construir la Colección de Opciones (delegación - Asumimos que [] es el valor por defecto si es null/undefined)
        const optionsArray = slideInput.answers
            ? slideInput.answers.map(this.buildOption)
            : [];
            
        // 3. Preparar las propiedades base
        const slideProps: Omit<SlideProps, 'slideType' | 'evalStrategy'> = {
            position: position, 
            timeLimit: timeLimitVO,
            points: pointsVO,
            question: questionVO,
            slideImage: slideImageVO,
            options: this.buildOptionalVO(optionsArray),
            description: this.buildOptionalVO(new Description("xd")), // Optional.empty()
        };
        
        const slideType = slideInput.type as SlideTypeEnum;

        const SlideConstructor = resolveSlideConstructor(slideType);
        return new SlideConstructor(slideProps as SlideProps, slideId);
    }
    
    // ====================================================================
    // 🏆 MÉTODO PÚBLICO FINAL: Crea el Aggregate Root a partir de JSON de entrada
    // ====================================================================

    public static createFromRawInput(kahootInput: KahootInput): Kahoot {
        
        // 1. Conversión de Atributos del AR
        const kahootId = new KahootId(kahootInput.id);
        const authorId = new UserId(kahootInput.authorId);
        const createdAt = kahootInput.createdAt ? DateISO.createFrom(kahootInput.createdAt) : DateISO.generate();
        const visibility = new VisibilityStatus(kahootInput.visibility as VisibilityStatusEnum);
        const status = new KahootStatus(kahootInput.status as KahootStatusEnum) ;
        const imageId: Optional<ImageId> = this.buildOptionalVO(
            kahootInput.coverImageId 
                ? new ImageId(kahootInput.coverImageId) 
                : null
        );
        const themeId = new ThemeId(kahootInput.themeId)
        
        // 2. Ensamblaje de la Colección de Slides
        const slidesMap = new Map<SlideId, Slide>();
        if (kahootInput.questions) {
            kahootInput.questions.forEach((slideInput, index) => {
                const position = index; 
                const slide = this.buildSlide(slideInput, position); 
                slidesMap.set(slide.id, slide);
            });
        }
        
        // 3. Ensamblaje del Aggregate Root
        const props: KahootProps = {
            author: authorId,
            createdAt: createdAt,
            styling: new KahootStyling(imageId, themeId), 
            details: this.buildOptionalVO(new KahootDetails(
                this.buildOptionalVO(kahootInput.title ?? null),       
                this.buildOptionalVO(kahootInput.description ?? null), 
                this.buildOptionalVO(kahootInput.category ?? null)   
            )),
            visibility: visibility,
            status: status,
            playCount: new PlayNumber(kahootInput.playCount),
            slides: slidesMap,
        };
        
        return new Kahoot(props, kahootId);
    }
}