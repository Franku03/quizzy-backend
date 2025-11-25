import { Optional } from "src/core/types/optional";
import { Slide } from "../entities/kahoot.slide";
import { KahootDetails } from "../value-objects/kahoot.details";
import { PlayNumber } from "../value-objects/kahoot.play-number";
import { SlideId } from "../value-objects/kahoot.slide.id";
import { KahootStatus, KahootStatusEnum } from "../value-objects/kahoot.status";
import { VisibilityStatus } from "../value-objects/kahoot.visibility-status";
import { KahootId } from "../value-objects/kahoot.id";
import { AggregateRoot } from "src/core/domain/aggregate.root";
import { Question } from "../value-objects/kahoot.slide.question";
import { Option } from "../value-objects/kahoot.slide.option";
import { EvaluationStrategy } from "../helpers/i-evalutaion.strategy";
import { Submission } from "../helpers/parameter.object.submission";
import { Result } from "../helpers/parameter.object.result";

interface UserId {
    readonly value: string;
}

interface KahootProps {
    author: UserId;
    createdAt: Date;
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
        if (!props.author || !props.status || !props.visibility || !props.playCount) {
            throw new Error("El Kahoot requiere autor, estado, visibilidad y conteo inicial.");
        }
        
        super({...props, slides: slidesMap, details: detailsOptional}, id);
    }
    
    public publish(): void {
        this.checkPublishingReadiness(); 
        this.properties.status = new KahootStatus(KahootStatusEnum.PUBLISHED); 
    }
    
    public draft(): void {
        this.properties.status = new KahootStatus(KahootStatusEnum.DRAFT); 
    }

    protected checkInvariants(): void {
        if (this.properties.status.value === KahootStatusEnum.PUBLISHED) {
            this.checkPublishingReadiness();
        }
    }

    private checkPublishingReadiness(): void {
        // Regla 1: Debe tener detalles.
        if (this.properties.details.hasValue()) { 
            throw new Error("No se puede publicar: El Kahoot debe tener detalles (título y descripción).");
        }
        
        // Regla 2: Debe tener al menos un slide.
        if (this.properties.slides.size === 0) {
            throw new Error("No se puede publicar: El Kahoot debe contener al menos un slide.");
        }
        
        // Regla 3: Todos los slides deben ser válidos
        for (const slide of this.properties.slides.values()) {
            slide.validateInvariants(); 
        }
    }


    public getSlideById(slideId: SlideId): Slide | null {

        return this.properties.slides.get(slideId) || null;
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
        const slideId = submission.slideID
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
        
        // Delega la mutación.
        slide.removeOptionByIndex(indexToDelete);
        this.checkInvariants();
    }

    public updateSlideOption(indexToUpdate: number, newOption: Option): void {
        this.checkInvariants();
    }
}