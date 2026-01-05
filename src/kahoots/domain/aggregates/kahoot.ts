import { Optional } from "src/core/types/optional";
import { Slide } from "../entities/slides/kahoot.slide";
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
import { Result } from '../../../core/domain/shared-value-objects/parameter-objects/parameter.object.result';
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { TimeLimitSeconds } from "../../../core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "../../../core/domain/shared-value-objects/value-objects/value.object.points";
import { SlideType } from "../value-objects/kahoot.slide.type";
import { KahootStyling } from "../value-objects/kahoot.styling";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";
import { SlideIdValue } from "../types/id-types"
import { Either, ErrorData } from "src/core/types";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { IDomainErrorContext } from "src/core/errors/interface/context/i-error-domain.context";

interface UserId {
    readonly value: string;
}

export interface KahootProps {
    author: UserId;
    createdAt: DateISO;
    styling: KahootStyling;
    details: Optional<KahootDetails>;
    visibility: VisibilityStatus;
    status: KahootStatus;
    slides: Map<SlideIdValue, Slide>;
    playCount: PlayNumber; 
}

export class Kahoot extends AggregateRoot<KahootProps, KahootId> {

    private constructor(props: KahootProps, id: KahootId) {
        super(props, id);
    }

    private getContext(operation: string): IDomainErrorContext {
        return createDomainContext('Kahoot', operation, {
            domainObjectKind: 'AggregateRoot',
            domainObjectId: this.id.value
        });
    }

    // --- Factory Method ---
    public static create(props: KahootProps, id: KahootId): Either<ErrorData, Kahoot> {
        const domainContext = createDomainContext('Kahoot', 'createAggregate', {
            domainObjectKind: 'AggregateRoot'
        });

        if (!props.author || !props.status || !props.visibility || !props.styling) {
            return Either.makeLeft(DomainErrorFactory.validation(
                domainContext,
                { generic: ['REQUIRED_DATA_MISSING'] },
                "Faltan atributos mandatorios para crear el Kahoot (Author, Status, Visibility o Styling)."
            ));
        }

        const kahoot = new Kahoot(props, id);
        return kahoot.checkInvariants().map(() => kahoot);
    }

    // --- Validación de Invariantes ---
    protected checkInvariants(): Either<ErrorData, void> {
        if (this.properties.status.value === KahootStatusEnum.PUBLISH) {
            return this.checkPublishingReadiness();
        }
        return Either.makeRight(undefined);
    }

    private checkPublishingReadiness(): Either<ErrorData, void> {
        const context = this.getContext('checkPublishingReadiness');
        let detailsResult: Either<ErrorData, KahootDetails>;
        if (this.properties.details.hasValue()) {
            detailsResult = Either.makeRight(this.properties.details.getValue());
        } else {
            detailsResult = Either.makeLeft(DomainErrorFactory.validation(
                context, { details: ['MISSING'] }, "Details are required for publishing."
            ));
        }

        return detailsResult
            .chain(details => details.isValidDetails())
            .chain(() => {
                if (this.properties.slides.size === 0) {
                    return Either.makeLeft(DomainErrorFactory.validation(
                        context, { slides: ['EMPTY_KAHOOT'] }, "El Kahoot no tiene slides."
                    ));
                }

                for (const slide of this.properties.slides.values()) {
                    const slideResult = slide.isPublishingCompliant();
                    if (slideResult.isLeft()) return slideResult;
                }

                return Either.makeRight(undefined);
            });
    }

    // --- Comportamientos de Estado (Life Cycle) ---
    public publish(): Either<ErrorData, void> {
        this.properties.status = new KahootStatus(KahootStatusEnum.PUBLISH);
        return this.checkInvariants();
    }

    public draft(): void {
        this.properties.status = new KahootStatus(KahootStatusEnum.DRAFT);
    }

    public changeStatus(newStatus: string): Either<ErrorData, void> {
        const context = this.getContext('changeStatus');
        switch (newStatus) {
            case KahootStatusEnum.DRAFT:
                this.draft();
                return Either.makeRight(undefined);
            case KahootStatusEnum.PUBLISH:
                return this.publish();
            default:
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { status: ['INVALID_STATUS'] }, "Estado de Kahoot inválido."
                ));
        }
    }

    // --- Comportamientos de Visibilidad ---
    public makePublic(): void {
        this.properties.visibility = new VisibilityStatus(VisibilityStatusEnum.PUBLIC);
    }

    public hide(): void {
        this.properties.visibility = new VisibilityStatus(VisibilityStatusEnum.PRIVATE);
    }

    public changeVisibility(newVisibility: string): Either<ErrorData, void> {
        const context = this.getContext('changeVisibility');
        switch (newVisibility) {
            case VisibilityStatusEnum.PUBLIC: this.makePublic(); break;
            case VisibilityStatusEnum.PRIVATE: this.hide(); break;
            default:
                return Either.makeLeft(DomainErrorFactory.validation(
                    context, { visibility: ['INVALID_VISIBILITY'] }, "Visibilidad no válida."
                ));
        }
        return Either.makeRight(undefined);
    }

    // --- Actualización de Atributos ---
    public updateStyling(newStyling: KahootStyling): Either<ErrorData, void> {
        this.properties.styling = newStyling;
        return Either.makeRight<ErrorData, void>(undefined);
    }

    public updateDetails(newDetails?: KahootDetails): Either<ErrorData, void> {
        this.properties.details = new Optional(newDetails);
        return this.checkInvariants();
    }

    // --- Gestión de Colección de Slides ---
    public addSlide(slide: Slide): Either<ErrorData, void> {
        this.properties.slides.set(slide.idString, slide);
        return this.checkInvariants();
    }

    public removeSlide(slideId: SlideId): Either<ErrorData, void> {
        const context = this.getContext('removeSlide');
        if (!this.properties.slides.delete(slideId.value)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slideId: ['NOT_FOUND'] }, "Slide no encontrado para eliminar."
            ));
        }
        this.reorderSlidesPositions();
        return this.checkInvariants();
    }

    public replaceSlides(slides: Map<SlideIdValue, Slide>): Either<ErrorData, void> {
        this.properties.slides = slides;
        return this.checkInvariants();
    }

    // --- Delegación a Slides (Arreglado para evitar error de Type 'void') ---
    public reorderSlide(id: SlideId, newPos: number): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.changePosition(newPos));
    }

    public updateSlideQuestion(id: SlideId, q: Optional<Question>): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => {
            s.updateQuestion(q);
            return Either.makeRight(undefined);
        });
    }

    public updateSlideType(id: SlideId, t: SlideType): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.updateSlideType(t));
    }

    public updateSlideTimeLimit(id: SlideId, t: TimeLimitSeconds): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => {
            s.updateTimeLimit(t);
            return Either.makeRight(undefined);
        });
    }

    public updateSlidePoints(id: SlideId, p: Optional<Points>): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => {
            s.updatePoints(p);
            return Either.makeRight(undefined);
        });
    }

    public updateSlideImage(id: SlideId, i: Optional<ImageId>): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => {
            s.updateSlideImage(i);
            return Either.makeRight(undefined);
        });
    }

    public changeEvaluationStrategy(id: SlideId, st: EvaluationStrategy): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.changeEvaluationStrategy(st));
    }

    public addSlideOption(id: SlideId, opt: Option): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.addOption(opt));
    }

    public updateSlideOption(id: SlideId, opt: Option, idx: number): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.updateOption(idx, opt));
    }

    public removeSlideOptionByIndex(id: SlideId, idx: number): Either<ErrorData, void> {
        return this.delegateToSlide(id, s => s.removeOptionByIndex(idx));
    }

    // --- Evaluación (Throw por compatibilidad) ---
    public evaluateAnswer(submission: Submission): Result {
        const context = this.getContext('evaluateAnswer');
        const slide = this.getSlideById(submission.getSlideId());

        if (!slide) throw DomainErrorFactory.validation(context, { slideId: ['NOT_FOUND'] }, "Slide no encontrado.");
        if (this.isDraft()) throw DomainErrorFactory.validation(context, { status: ['IS_DRAFT'] }, "Evaluación prohibida en modo DRAFT.");

        return slide.evaluateAnswer(submission);
    }

    // --- Consultas y Navegación ---
    public getSlideSnapshotById(id: SlideId): SlideSnapshot | null {
        return this.getSlideById(id)?.getSnapshot() || null;
    }

    public getNextSlideSnapshotById(currentId: SlideId | null): SlideSnapshot | null {
        const sorted = this.getSortedSlides();
        if (sorted.length === 0) return null;
        const index = currentId ? sorted.findIndex(s => s.id.equals(currentId)) : -1;
        return sorted[index + 1]?.getSnapshot() || null;
    }

    public getNextSlideSnapshotByIndex(currentIndex: number = -1): SlideSnapshot | null {
        if (this.properties.slides.size === 0) return null;

        const sortedSlides = this.getSortedSlides();
        const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
        const nextSlide = sortedSlides[nextIndex];

        return nextSlide ? nextSlide.getSnapshot() : null;
    }

    // --- Helpers Internos ---
    private getSlideById(slideId: SlideId): Slide | null {
        return this.properties.slides.get(slideId.value) || null;
    }

    private delegateToSlide(
        id: SlideId,
        action: (s: Slide) => Either<ErrorData, void>
    ): Either<ErrorData, void> {
        const context = this.getContext('delegateToSlide');
        const slide = this.getSlideById(id);

        if (!slide) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { slideId: ['NOT_FOUND'] }, "Slide ID does not exist."
            ));
        }

        return action(slide).chain(() => this.checkInvariants());
    }

    private reorderSlidesPositions(): void {
        this.getSortedSlides().forEach((slide, index) => {
            slide.changePosition(index);
        });
    }

    private getSortedSlides(): Slide[] {
        return Array.from(this.properties.slides.values()).sort((a, b) => a.position - b.position);
    }

    // --- Snapshots ---
    public getSnapshot(): KahootSnapshot {
        return KahootSnapshot.fromRaw({
            id: this.id.value,
            authorId: this.properties.author.value,
            createdAt: this.properties.createdAt.value,
            visibility: this.properties.visibility.value,
            status: this.properties.status.value,
            playCount: this.properties.playCount.count,
            styling: this.properties.styling.getSnapshot(),
            details: this.properties.details.hasValue()
                ? this.properties.details.getValue().getSnapshot()
                : undefined,
            slides: this.getSortedSlides().map(s => s.getSnapshot()),
        });
    }

    // --- Getters y Checkers ---
    public get idString(): string { return this.id.value; }
    public get authorId(): string { return this.properties.author.value; }
    public get createdAt(): DateISO { return this.properties.createdAt; }
    public get status(): KahootStatus { return this.properties.status; }
    public get visibility(): VisibilityStatus { return this.properties.visibility; }
    public get styling(): KahootStyling { return this.properties.styling; }
    public get details(): Optional<KahootDetails> { return this.properties.details; }
    public get slides(): Map<string, Slide> { return this.properties.slides; }
    public get playCount(): PlayNumber { return this.properties.playCount; }

    public isDraft(): boolean { return this.properties.status.value === KahootStatusEnum.DRAFT; }
    public isPrivate(): boolean { return this.properties.visibility.value === VisibilityStatusEnum.PRIVATE; }
    public hasHowManySlides(): number { return this.properties.slides.size; }
}


