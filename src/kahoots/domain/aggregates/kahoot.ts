import { Optional } from "src/core/types/optional";
import { Slide } from "../entities/kahoot.slide";
import { KahootDetails } from "../value-objects/kahoot.details";
import { PlayNumber } from "../value-objects/kahoot.play-number";
import { SlideId } from "../../../core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { KahootStatus, KahootStatusEnum } from "../value-objects/kahoot.status";
import { VisibilityStatus, VisibilityStatusEnum } from '../value-objects/kahoot.visibility-status';
import { KahootId } from "../../../core/domain/shared-value-objects/id-objects/kahoot.id";
import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { Question } from "../value-objects/kahoot.slide.question";
import { Option } from "../value-objects/kahoot.slide.option";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { Submission } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Result } from "../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { TimeLimitSeconds } from "../../../core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "../../../core/domain/shared-value-objects/value-objects/value.object.points";
import { SlideType } from "../value-objects/kahoot.slide.type";
import { KahootStyling } from "../value-objects/kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

interface UserId {
    readonly value: string;
}

interface KahootProps {
    author: UserId;
    createdAt: Date;
    styling: KahootStyling;
    details: Optional<KahootDetails>; 
    visibility: VisibilityStatus;
    status: KahootStatus;
    slides: Map<SlideId, Slide>; 
    playCount: PlayNumber;
}

export class Kahoot extends AggregateRoot<KahootProps, KahootId> {

    public constructor(props: KahootProps, id: KahootId) {
        
        // Maneja la opcionalidad de la colección y los detalles en el constructor
        const slidesMap = props.slides || new Map<SlideId, Slide>();
        const detailsOptional = props.details ? props.details : new Optional<KahootDetails>();

        // 1. Invariantes Transaccionales (Mínimo necesario para existir, incluso en Draft)
        // Solo la información esencial y el autor son mandatorios.
        if (!props.author || !props.status || !props.visibility || !props.playCount || !props.styling) {
            throw new Error("El Kahoot requiere autor, estado, visibilidad, styling y conteo inicial.");
        }
        
        super({...props, slides: slidesMap, details: detailsOptional}, id);
    }

    /* =====================================================================================
                Comportamientos del Kahoot (TODO LO QUE NO TIENE REALCION CON EL SLIDE)
    =====================================================================================*/
    

    //Se encarga de verificar que el Kahoot cumple con los requisitos necesarios antes de permitir ciertos cambios de estado, como la publicación o el cambio de visibilidad.
    protected checkInvariants(): void {
        if (this.properties.status.value === KahootStatusEnum.PUBLISHED) {
            this.checkPublishingReadiness();
        }
    }

    private checkPublishingReadiness(): void {
        // Regla 1: Debe tener detalles.
        if (!this.properties.details.hasValue()) { 
            throw new Error("No se puede publicar: El Kahoot debe tener detalles (título y descripción).");
        }
        
        // Regla 2: Debe tener al menos un slide.
        if (this.properties.slides.size === 0) {
            throw new Error("No se puede publicar: El Kahoot debe contener al menos un slide.");
        }
        
        // Regla 3: Todos los slides deben ser válidos
        for (const slide of this.properties.slides.values()) {
            slide.isPublishingCompliant(); 
        }
    }

    //Se encarga de manejar la publicación del Kahoot, asegurándose de que cumple con los requisitos necesarios antes de cambiar su estado a publicado.
    public publish(): void {
        this.checkPublishingReadiness(); 
        this.properties.status = new KahootStatus(KahootStatusEnum.PUBLISHED); 
    }
    
    public draft(): void {
        this.properties.status = new KahootStatus(KahootStatusEnum.DRAFT); 
    }


    //Se encarga de la visibilidad del Kahoot, permitiendo cambiar entre público y privado.
    public makePublic(): void {
        this.properties.visibility = new VisibilityStatus(VisibilityStatusEnum.PUBLIC); 
    }

    public hide(): void {
        this.properties.visibility = new VisibilityStatus(VisibilityStatusEnum.PRIVATE);
    }


    //Se encarga de cambair el estilo del Kahoot.
    public updateStyling(newStyling: KahootStyling): void {
        this.properties.styling = newStyling;
    }

    //Se encarga de cambiar los detalles del Kahoot.
    public updateDetails(newDetails: KahootDetails): void {
        // Reemplaza la referencia Optional<T> con la nueva instancia.
        this.properties.details = new Optional(newDetails);
    }

    //En ninguno de los metodos anteriores es necesario llamar a checkInvariants ya que no afectan las reglas de negocio relacionadas con la publicacion.
    //Ya que cada vo individual se encarga de validar sus propias reglas de negocio.
    //El check invariants son reglas muy especificas relacionadas con la publicacion del kahoot.
    //Considerando q los atributos q antes podian ser opcionales ya no no pueden serlo al ser draft.
    //Mucho mas aun con el slide.

    /* =====================================================================================
                        Comportamientos relacionados con los Slides
    =====================================================================================*/

    //Todos los metodos aqui presentes delegan su llamada a la entidad Slide correspondiente.

    private getSlideById(slideId: SlideId): Slide | null {

        return this.properties.slides.get(slideId) || null;
    }

    public getSlideSnapshotById(slideId: SlideId): SlideSnapshot | null {
        const slide = this.getSlideById(slideId)
        if(slide) return slide.getSnapshot()
        return null
    }

    public nextSlideSnapshot(currentIndex: number): SlideSnapshot | null {
        const slidesMap = this.properties.slides;

        if (slidesMap.size === 0) {
            return null;
        }

        const sortedSlides = Array.from(slidesMap.values()).sort(
            (a, b) => a.position - b.position 
        );

        const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
        const nextSlide = sortedSlides[nextIndex];

        if (!nextSlide) {
            return null;
        }
        return nextSlide.getSnapshot();
    }

    public addSlide(slide: Slide): void {
        this.properties.slides.set(slide.id, slide);
    }

    public removeSlide(slideId: SlideId): void {
        if (!this.properties.slides.delete(slideId)) {
            throw new Error(`No se encontró el slide con ID ${slideId.value}.`);
        }
    }

    public reorderSlide(slideId: SlideId, newPosition: number): void {
        const slideToMove = this.getSlideById(slideId);
        if (!slideToMove) {
            throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        }
        slideToMove.changePosition(newPosition);     
        this.checkInvariants();
    }

    public updateSlideQuestion(slideId: SlideId, newQuestion: Optional<Question>): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.updateQuestion(newQuestion);
        this.checkInvariants();
    }


    public changeEvaluationStrategy(slideId: SlideId, newStrategy: EvaluationStrategy): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.changeEvaluationStrategy(newStrategy);
    }


    public evaluateAnswer(submission: Submission): Result {
        const slideId = submission.getSlideId();
        const slide = this.getSlideById(slideId);
        if (!slide) {
            throw new Error(`No se puede evaluar: Slide ID ${slideId.value} no encontrado.`);
        }
        return slide.evaluateAnswer(submission);
    }

    public addSlideOption(slideId: SlideId, newOption: Option): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.addOption(newOption); 
        this.checkInvariants();
    }

    public removeSlideOptionByIndex(slideId: SlideId, indexToDelete: number): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);     
        slide.removeOptionByIndex(indexToDelete);
        this.checkInvariants();
    }

    public updateSlideOption(slideId: SlideId, newOption: Option, indexToUpdate: number): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);     
        slide.updateOption(indexToUpdate, newOption);
        this.checkInvariants();
    }

    public updateSlideTimeLimit(slideId: SlideId, newTimeLimit: TimeLimitSeconds): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.updateTimeLimit(newTimeLimit);
        this.checkInvariants();
    }


    public updateSlideImage(slideId: SlideId, newImage: Optional<ImageId>): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.updateSlideImage(newImage);
        this.checkInvariants();
    }

    public updateSlidePoints(slideId: SlideId, newPoints: Optional<Points>): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.updatePoints(newPoints);
        this.checkInvariants();
    }

    public updateSlideType(slideId: SlideId, newSlideType: SlideType): void {
        const slide = this.getSlideById(slideId);
        if (!slide) throw new Error(`Slide ID ${slideId.value} no encontrado.`);
        slide.updateSlideType(newSlideType);
        this.checkInvariants();
    }
}