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
// Interfaces de Entrada y Snapshot (Declaraciones)
// ====================================================================

export interface OptionInput { text: string | null; mediaId: string | null; isCorrect?: boolean; }
export interface SlideInput { id: string; position: number; text: string | null; mediaId: string | null; type: string; timeLimit: number; points: number | null; answers?: OptionInput[] | null; }
export interface KahootInput { id: string; authorId: string; createdAt: string | null; visibility: string; status: string; playCount: number; themeId: string; title: string | null; description: string | null; coverImageId: string | null; category: string | null; questions?: SlideInput[] | null; }

// ====================================================================
// Clase KahootFactory
// ====================================================================

export class KahootFactory{

    // --- MAPEO DE CONSTRUCTORES ---
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

    // --- HELPERS DE TIPADO Y COLECCIONES (DRY) ---
    private static buildOptionalVO<T>(value: T | null): Optional<T> {
        const optionalContent: T | undefined = (value !== null) ? value : undefined;
        return new Optional(optionalContent);
    }
    
    private static assembleCreatedAt(dateInput: string | null): DateISO {
        if (dateInput) {
            return DateISO.createFrom(dateInput);
        }
        return DateISO.generate();
    }
    
    private static assembleSlidesMap<T extends SlideInput | SlideSnapshot>(
        slidesArray: T[] | null | undefined,
        builderFunction: (input: T, position: number) => Slide
    ): Map<SlideIdValue, Slide> {
        const slidesMap = new Map<SlideIdValue, Slide>();
        
        if (slidesArray) {
            slidesArray.forEach((input, index) => {
                const slide = builderFunction(input, index);
                slidesMap.set(slide.id.value, slide);
            });
        }
        return slidesMap;
    }

    private static assembleKahootDetails(
        title: string | null,
        description: string | null,
        category: string | null
    ): Optional<KahootDetails> {
        
        if (!title && !description && !category) {
            return this.buildOptionalVO<KahootDetails>(null);
        }

        const detailsVO = new KahootDetails(
            this.buildOptionalVO(title), 
            this.buildOptionalVO(description), 
            this.buildOptionalVO(category)
        );
        
        return this.buildOptionalVO(detailsVO);
    }

    private static assembleKahootStyling(themeIdValue: string, coverImageId: string | null): KahootStyling {
        const themeId = new ThemeId(themeIdValue);
        
        const imageIdOptional: Optional<ImageId> = this.buildOptionalVO(
            coverImageId ? new ImageId(coverImageId) : null
        );
        
        return new KahootStyling(imageIdOptional, themeId );
    }

    // --- ENSAMBLAJE DE SLIDE PROPS (DRY) ---

    private static assembleSlideProps(
        position: number, 
        timeLimit: number, 
        points: number | null, 
        questionText: string | null, 
        slideMediaId: string | null, 
        descriptionText: string | null, 
        options: Option[]
    ): Omit<SlideProps, 'slideType' | 'evalStrategy'> {
        
        const timeLimitVO = new TimeLimitSeconds(timeLimit);
        
        const slideProps: Omit<SlideProps, 'slideType' | 'evalStrategy'> = {
            position: position, 
            timeLimit: timeLimitVO,
            points: this.buildOptionalVO((points) ? new Points(points) : null),
            question: this.buildOptionalVO((questionText) ? new Question(questionText) : null),
            slideImage: this.buildOptionalVO((slideMediaId) ? new ImageId(slideMediaId) : null),
            description: this.buildOptionalVO((descriptionText) ? new Description(descriptionText) : null),
            options: this.buildOptionalVO(options),
        };

        return slideProps;
    }

    // ====================================================================
    // --- PARTE DE CREACIÓN (BUILD) ---
    // ====================================================================

    private static buildOption(optionInput: OptionInput): Option {
        const optionText = optionInput.text ?? "";
        const isCorrect = optionInput.isCorrect ?? false;
        
        const imageIdOrNull: ImageId | null = optionInput.mediaId
            ? new ImageId(optionInput.mediaId)
            : null;
        
        const optionImage: Optional<ImageId> = this.buildOptionalVO(imageIdOrNull); 

        return new Option(optionText, isCorrect, optionImage);
    }
    
    private static buildSlide(slideInput: SlideInput, position: number): Slide {
        const slideId = new SlideId(slideInput.id); 
        
        const optionsArray = slideInput.answers
            ? slideInput.answers.map(this.buildOption)
            : [];
            
        const slideProps = this.assembleSlideProps(
            position, 
            slideInput.timeLimit, 
            slideInput.points, 
            slideInput.text, 
            slideInput.mediaId, 
            "xd", 
            optionsArray
        );
        
        const SlideConstructor = this.resolveSlideConstructor(slideInput.type as SlideTypeEnum);
        
        return new SlideConstructor(slideProps as SlideProps, slideId);
    }
    
    public static createFromRawInput(kahootInput: KahootInput): Kahoot {
        
        const kahootId = new KahootId(kahootInput.id);
        const authorId = new UserId(kahootInput.authorId);
        const createdAt = this.assembleCreatedAt(kahootInput.createdAt);
        const visibility = new VisibilityStatus(kahootInput.visibility as VisibilityStatusEnum);
        const status = new KahootStatus(kahootInput.status as KahootStatusEnum) ;

        const stylingVO = this.assembleKahootStyling(kahootInput.themeId, kahootInput.coverImageId);
        
        const slidesMap = this.assembleSlidesMap(kahootInput.questions, this.buildSlide);
        
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
        
        const imageIdOrNull: ImageId | null = snapshot.optionImageId
            ? new ImageId(snapshot.optionImageId)
            : null;
            
        const optionImage: Optional<ImageId> = this.buildOptionalVO(imageIdOrNull); 

        const optionText = snapshot.optionText ?? "";

        return new Option(optionText, snapshot.isCorrect, optionImage);
    }

    private static reconstructSlideFromSnapshot(snapshot: SlideSnapshot, position: number): Slide {
        
        const slideId = new SlideId(snapshot.id);
        
        const optionsArray: Option[] = snapshot.options
            ? snapshot.options.map(this.reconstructOptionFromSnapshot)
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
            ).getValue() : null
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