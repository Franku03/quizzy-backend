// kahoot.factory.ts (Corregido)

// [Mantener todos los imports existentes]
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Slide, SlideProps } from "../entities/kahoot.slide";
import { KahootStatus, KahootStatusEnum } from "../value-objects/kahoot.status";
import { VisibilityStatus, VisibilityStatusEnum } from "../value-objects/kahoot.visibility-status";
import { Kahoot, KahootProps } from "../aggregates/kahoot";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Optional } from "src/core/types/optional";
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
import { KahootSnapshot } from "src/core/domain/snapshots/snpapshot.kahoot";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { SlideIdValue } from "../types/id-types";
import { SingleChoiceSlide } from "../entities/kahoot.slide.single-choice";
import { MultipleChoiceSlide } from "../entities/kahoot.slide.multiple-choise";
import { TrueFalseSlide } from "../entities/kahoot.slide.true-false";
import { ShortAnswerSlide } from "../entities/kahoot.slide.short-answer";
import { DisplaySlide } from "../entities/kahoot.slide.display-slide"; 


// ====================================================================
// Interfaces de Entrada (Alineadas al Dominio)
// ====================================================================

export interface OptionInput { 
    text: string; 
    optionImage?: string; 
    isCorrect: boolean; 
}

export interface SlideInput { 
    id: string; 
    position: number; 
    slideType: string; 
    timeLimit: number; 
    question?: string; 
    slideImage?: string; 
    points?: number; 
    description?: string; 
    options?: OptionInput[]; 
}

export interface KahootInput { 
    id: string; 
    authorId: string; 
    createdAt?: string; 
    visibility: string; 
    status: string; 
    playCount: number;
    themeId: string; 
    imageId?: string;
    title?: string; 
    description?: string; 
    category?: string; 
    slides?: SlideInput[]; 
}

// ====================================================================
// Clase KahootFactory
// ====================================================================

export class KahootFactory{

    // --- MAPEO DE CONSTRUCTORES (Mantener) ---
    private static readonly SlideConstructorsMap: { [key in SlideTypeEnum]: new (props: SlideProps, id: SlideId) => Slide } = {
        [SlideTypeEnum.SINGLE]: SingleChoiceSlide,
        [SlideTypeEnum.MULTIPLE]: MultipleChoiceSlide,
        [SlideTypeEnum.TRUE_FALSE]: TrueFalseSlide,
        [SlideTypeEnum.SHORT_ANSWER]: ShortAnswerSlide,
        [SlideTypeEnum.SLIDE]: DisplaySlide,
    };

    private static resolveSlideConstructor(type: SlideTypeEnum): new (props: SlideProps, id: SlideId) => Slide {
        const SlideConstructor = this.SlideConstructorsMap[type];
        
        if (!SlideConstructor) {
            throw new Error(`Tipo de slide desconocido: ${type}`);
        }
        return SlideConstructor;
    }

    // --- HELPERS DE TIPADO (Ajustar a undefined) ---
    // Cambiamos 'T | null' por 'T | undefined' para alinearnos con el Mapper
    private static buildOptionalVO<T>(value: T | undefined): Optional<T> {
        return new Optional(value);
    }
    
    private static assembleCreatedAt(dateInput?: string): DateISO {
        if (dateInput) {
            return DateISO.createFrom(dateInput);
        }
        return DateISO.generate();
    }
    
    private static assembleSlidesMap<T extends SlideInput | SlideSnapshot>(
        slidesArray: T[] | undefined,
        builderFunction: (input: T, position: number) => Slide
    ): Map<SlideIdValue, Slide> {
        const slidesMap = new Map<SlideIdValue, Slide>();
        
        if (slidesArray) {
            // CORRECCIÓN: Usar .call(KahootFactory, input, index) para forzar el 'this'
            // O mejor, si builderFunction es estática (como buildSlide/reconstructSlideFromSnapshot),
            // es más limpio usar una función de flecha para que builderFunction sepa que 'this' es KahootFactory
            slidesArray.forEach((input, index) => {
                // Al usar .call, nos aseguramos que 'this' dentro de builderFunction sea KahootFactory
                const slide = builderFunction.call(KahootFactory, input, index);
                slidesMap.set(slide.id.value, slide);
            });
        }
        return slidesMap;
    }

    public static assembleKahootDetails(
        title: string | undefined,
        description: string | undefined,
        category: string | undefined
    ): Optional<KahootDetails> {
        
        if (!title && !description && !category) {
            return this.buildOptionalVO<KahootDetails>(undefined);
        }

        const detailsVO = new KahootDetails(
            this.buildOptionalVO(title), 
            this.buildOptionalVO(description), 
            this.buildOptionalVO(category)
        );
        
        return this.buildOptionalVO(detailsVO);
    }

    public static assembleKahootStyling(themeIdValue: string, coverImageId: string | undefined): KahootStyling {
        const themeId = new ThemeId(themeIdValue);
        
        const imageIdOptional: Optional<ImageId> = this.buildOptionalVO(
            coverImageId ? new ImageId(coverImageId) : undefined
        );
        
        return new KahootStyling(imageIdOptional, themeId );
    }

    // --- ENSAMBLAJE DE SLIDE PROPS (DRY) ---

    private static assembleSlideProps(
        position: number, 
        timeLimit: number, 
        points: number | undefined, 
        questionText: string | undefined, 
        slideMediaId: string | undefined, 
        descriptionText: string | undefined, 
        options: Option[]
    ): Omit<SlideProps, 'slideType' | 'evalStrategy'> {
        
        const timeLimitVO = new TimeLimitSeconds(timeLimit);
        
        const slideProps: Omit<SlideProps, 'slideType' | 'evalStrategy'> = {
            position: position, 
            timeLimit: timeLimitVO,
            // Mapeo condicional de VOs basado en undefined
            points: this.buildOptionalVO(points ? new Points(points) : undefined),
            question: this.buildOptionalVO(questionText ? new Question(questionText) : undefined),
            slideImage: this.buildOptionalVO(slideMediaId ? new ImageId(slideMediaId) : undefined),
            description: this.buildOptionalVO(descriptionText ? new Description(descriptionText) : undefined),
            options: this.buildOptionalVO(options.length > 0 ? options : undefined),
        };

        return slideProps;
    }

    // ====================================================================
    // --- PARTE DE CREACIÓN (BUILD) ---
    // ====================================================================

    private static buildOption(optionInput: OptionInput): Option {
        // OptionInput ya viene con optionText garantizado y optionImageId como string | undefined
        
        const imageIdOptional: Optional<ImageId> = this.buildOptionalVO(
            optionInput.optionImage ? new ImageId(optionInput.optionImage) : undefined
        ); 

        return new Option(optionInput.text, optionInput.isCorrect, imageIdOptional);
    }
    
    public static buildSlide(slideInput: SlideInput): Slide {
        const slideId = new SlideId(slideInput.id); 
        
        // La línea 196 (del código original) era: 
        // ? slideInput.options.map(opt => this.buildOption(opt))
        // La corrección se realiza aquí, usando una función de flecha para mantener el 'this' correcto
        const optionsArray = slideInput.options
            ? slideInput.options.map(opt => KahootFactory.buildOption(opt)) // USAR KahootFactory.buildOption o (opt => this.buildOption(opt)) si `this` está garantizado, pero para un método estático como `buildSlide` es más seguro usar el nombre de la clase. Usando una función de flecha es la solución más simple para asegurar el contexto `this`.
            : [];
        
        const slideProps = this.assembleSlideProps(
            slideInput.position, 
            slideInput.timeLimit, 
            slideInput.points, 
            slideInput.question, 
            slideInput.slideImage, 
            slideInput.description, 
            optionsArray
        );
        
        const SlideConstructor = this.resolveSlideConstructor(slideInput.slideType as SlideTypeEnum);
        
        return new SlideConstructor(slideProps as SlideProps, slideId);
    }
    
    public static createFromRawInput(kahootInput: KahootInput): Kahoot {
        
        const kahootId = new KahootId(kahootInput.id);
        const authorId = new UserId(kahootInput.authorId);
        const createdAt = this.assembleCreatedAt(kahootInput.createdAt);
        const visibility = new VisibilityStatus(kahootInput.visibility as VisibilityStatusEnum);
        const status = new KahootStatus(kahootInput.status as KahootStatusEnum) ;

        const stylingVO = this.assembleKahootStyling(kahootInput.themeId, kahootInput.imageId);
        
        // CORRECCIÓN: Pasar una función de flecha al llamar a assembleSlidesMap
        // Esto garantiza que this.buildSlide mantenga el contexto 'this' de KahootFactory.
        // **Otra solución (elegida para assembleSlidesMap) es usar .call/bind dentro de assembleSlidesMap**
        // Usaremos la solución de .call/bind en assembleSlidesMap ya que es más limpia.
        const slidesMap = this.assembleSlidesMap(kahootInput.slides, this.buildSlide);
        
        const detailsVO = this.assembleKahootDetails(
            kahootInput.title, 
            kahootInput.description, 
            kahootInput.category
        );
        
        const props: KahootProps = {
            author: authorId,
            createdAt: createdAt,
            styling: stylingVO, 
            details: detailsVO,
            visibility: visibility,
            status: status,
            playCount: new PlayNumber(kahootInput.playCount),
            slides: slidesMap,
        };
        
        return new Kahoot(props, kahootId);
    }

    // ====================================================================
    // --- PARTE DE RECONSTRUCCIÓN (SNAPSHOT) ---
    // ====================================================================

    private static reconstructOptionFromSnapshot(snapshot: OptionSnapshot): Option {
        
        const imageIdOptional: Optional<ImageId> = this.buildOptionalVO(
            snapshot.optionImageId ? new ImageId(snapshot.optionImageId) : undefined
        ); 
        const optionText = snapshot.optionText ?? "";

        return new Option(optionText, snapshot.isCorrect, imageIdOptional);
    }

    private static reconstructSlideFromSnapshot(snapshot: SlideSnapshot, position: number): Slide {
        
        const slideId = new SlideId(snapshot.id);
        
        // Aquí también se usa una función de flecha para mantener el contexto `this`
        const optionsArray: Option[] = snapshot.options
            ? snapshot.options.map(opt => KahootFactory.reconstructOptionFromSnapshot(opt))
            : [];
            
        const slideProps = this.assembleSlideProps(
            position, 
            snapshot.timeLimitSeconds, 
            snapshot.pointsValue, 
            snapshot.questionText, 
            snapshot.slideImageId, 
            snapshot.descriptionText, 
            optionsArray
        );
        
        const SlideConstructor = this.resolveSlideConstructor(snapshot.slideType);
        
        return new SlideConstructor(slideProps as SlideProps, slideId);
    }
    
    public static reconstructFromSnapshot(snapshot: KahootSnapshot): Kahoot {
        
        const kahootId = new KahootId(snapshot.id);
        const authorId = new UserId(snapshot.authorId);
        const visibility = new VisibilityStatus(snapshot.visibility as VisibilityStatusEnum);
        const status = new KahootStatus(snapshot.status as KahootStatusEnum);
        const playCount = new PlayNumber(snapshot.playCount);
        
        const createdAt = this.assembleCreatedAt(snapshot.createdAt);

        const stylingVO = this.assembleKahootStyling(snapshot.styling.themeId, snapshot.styling.imageId);

        const detailsVO = this.buildOptionalVO(
            snapshot.details ? this.assembleKahootDetails(
                snapshot.details.title,
                snapshot.details.description,
                snapshot.details.category
            ).getValue() : undefined
        );
        
        const slidesMap = this.assembleSlidesMap(snapshot.slides, this.reconstructSlideFromSnapshot);
        
        const props: KahootProps = {
            author: authorId,
            createdAt: createdAt, 
            styling: stylingVO, 
            details: detailsVO,
            visibility: visibility,
            status: status,
            playCount: playCount,
            slides: slidesMap,
        };
        
        return new Kahoot(props, kahootId);
    }
}