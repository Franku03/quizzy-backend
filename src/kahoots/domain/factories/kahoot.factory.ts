import { Either, ErrorData } from "src/core/types";
import { Optional } from "src/core/types/optional";

// --- Domain Shared ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";
import { TimeLimitSeconds } from "src/core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "src/core/domain/shared-value-objects/value-objects/value.object.points";

// --- Domain Snapshots ---
import { KahootSnapshot } from "src/core/domain/snapshots/snapshot.kahoot";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option";

// --- Kahoot Domain ---
import { ThemeId } from "../value-objects/kahoot.theme";
import { KahootStatus } from "../value-objects/kahoot.status";
import { VisibilityStatus } from "../value-objects/kahoot.visibility-status";
import { PlayNumber } from "../value-objects/kahoot.play-number";
import { Question } from "../value-objects/kahoot.slide.question";
import { Description } from "../value-objects/kahoot.slide.description";
import { SlideTypeEnum } from "../value-objects/kahoot.slide.type";
import { Option } from "../value-objects/kahoot.slide.option";
import { KahootDetails } from "../value-objects/kahoot.details";
import { KahootStyling } from "../value-objects/kahoot.styling";
import { Slide, SlideProps } from "../entities/slides/kahoot.slide";
import { Kahoot } from "../aggregates/kahoot";
import { SlideIdValue } from "../types/id-types";

// --- Kahoot Entities ---
import { SingleChoiceSlide } from "../entities/slides/kahoot.slide.single-choice";
import { MultipleChoiceSlide } from "../entities/slides/kahoot.slide.multiple-choice";
import { TrueFalseSlide } from "../entities/slides/kahoot.slide.true-false";
import { ShortAnswerSlide } from "../entities/slides/kahoot.slide.short-answer";
import { DisplaySlide } from "../entities/slides/kahoot.slide.display-slide";

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

export class KahootFactory {
    private static readonly SlideCreatorsMap: Record<SlideTypeEnum, any> = {
        [SlideTypeEnum.SINGLE]: SingleChoiceSlide,
        [SlideTypeEnum.MULTIPLE]: MultipleChoiceSlide,
        [SlideTypeEnum.TRUE_FALSE]: TrueFalseSlide,
        [SlideTypeEnum.SHORT_ANSWER]: ShortAnswerSlide,
        [SlideTypeEnum.SLIDE]: DisplaySlide,
    };

    // --- Helpers de Construcción Interna ---

    public static buildOption(input: OptionInput): Either<ErrorData, Option> {
        return this.wrapOptional(input.optionImage, ImageId.create)
            .chain(imgIdVO => Option.create(input.text, input.isCorrect, imgIdVO));
    }

    private static buildOptionFromSnapshot(snap: OptionSnapshot): Either<ErrorData, Option> {
        const imgVO = snap.optionImageId 
            ? new Optional(new ImageId(snap.optionImageId)) 
            : new Optional<ImageId>();
            
        return Option.create(snap.optionText || "", snap.isCorrect, imgVO);
    }

    public static wrapOptional<T, R>(
        value: T | undefined,
        creator: (val: T) => Either<ErrorData, R>
    ): Either<ErrorData, Optional<R>> {
        if (value === undefined || value === null) {
            return Either.makeRight(new Optional<R>(undefined));
        }
        return creator(value).map(res => new Optional(res));
    }

    // --- Orquestación de Slides ---

    public static buildSlideFromInput(input: SlideInput, pos: number): Either<ErrorData, Slide> {
        const options: Option[] = [];
        if (input.options) {
            for (const o of input.options) {
                const optRes = this.buildOption(o);
                if (optRes.isLeft()) return Either.makeLeft(optRes.getLeft());
                options.push(optRes.getRight());
            }
        }

        const descriptionToProcess = (input.slideType === SlideTypeEnum.SLIDE) ? input.description : undefined;

        return SlideId.create(input.id).chain(sId =>
            this.assembleSlideProps(pos, input.timeLimit, input.points, input.question, input.slideImage, descriptionToProcess, options)
                .chain(props =>
                    this.resolveSlideCreator(input.slideType as SlideTypeEnum)
                        .chain(Creator => Creator.create(props, sId))
                )
        );
    }

    private static buildSlideFromSnapshot(snap: SlideSnapshot, pos: number): Either<ErrorData, Slide> {
        const options: Option[] = [];
        if (snap.options) {
            for (const o of snap.options) {
                const optRes = this.buildOptionFromSnapshot(o);
                if (optRes.isLeft()) return Either.makeLeft(optRes.getLeft());
                options.push(optRes.getRight());
            }
        }

        const descriptionToProcess = (snap.slideType === SlideTypeEnum.SLIDE) ? snap.descriptionText : undefined;

        return SlideId.create(snap.id).chain(sId =>
            this.assembleSlideProps(pos, snap.timeLimitSeconds, snap.pointsValue, snap.questionText, snap.slideImageId, descriptionToProcess, options)
                .chain(props =>
                    this.resolveSlideCreator(snap.slideType)
                        .chain(Creator => Creator.create(props, sId))
                )
        );
    }

    // --- Métodos de Ensamblaje Principal ---

    public static createFromInput(input: KahootInput): Either<ErrorData, Kahoot> {
        return this.processSlides(input.slides, (s, p) => this.buildSlideFromInput(s, p)).chain(slidesMap =>
            this.assembleStyling(input.themeId, input.imageId).chain(styling =>
                KahootId.create(input.id).chain(kId =>
                    UserId.create(input.authorId).chain(authorId =>
                        KahootStatus.create(input.status).chain(status =>
                            VisibilityStatus.create(input.visibility).chain(visibility =>
                                PlayNumber.create(input.playCount).chain(playCount => {
                                    const createdAtVO = input.createdAt ? DateISO.createFrom(input.createdAt) : DateISO.generate();
                                    return Kahoot.create({
                                        author: authorId,
                                        createdAt: createdAtVO,
                                        styling,
                                        details: this.assembleDetails(input.title, input.description, input.category),
                                        visibility,
                                        status,
                                        playCount,
                                        slides: slidesMap
                                    }, kId);
                                })
                            )
                        )
                    )
                )
            )
        );
    }

    public static reconstructFromSnapshot(snapshot: KahootSnapshot): Either<ErrorData, Kahoot> {
        return this.processSlides(snapshot.slides, (s, p) => this.buildSlideFromSnapshot(s, p)).chain(slidesMap =>
            this.assembleStyling(snapshot.styling.themeId, snapshot.styling.imageId).chain(styling =>
                KahootId.create(snapshot.id).chain(kId =>
                    UserId.create(snapshot.authorId).chain(authorId =>
                        KahootStatus.create(snapshot.status).chain(status =>
                            VisibilityStatus.create(snapshot.visibility).chain(visibility =>
                                PlayNumber.create(snapshot.playCount).chain(playCount =>
                                    Kahoot.create({
                                        author: authorId,
                                        createdAt: DateISO.createFrom(snapshot.createdAt),
                                        styling,
                                        details: this.assembleDetails(snapshot.details?.title, snapshot.details?.description, snapshot.details?.category),
                                        visibility,
                                        status,
                                        playCount,
                                        slides: slidesMap
                                    }, kId)
                                )
                            )
                        )
                    )
                )
            )
        );
    }

    // --- Lógica de Soporte ---

    private static assembleSlideProps(
        pos: number, time: number, pts: number | undefined, ques: string | undefined, 
        img: string | undefined, desc: string | undefined, opts: Option[]
    ): Either<ErrorData, SlideProps> {
        return TimeLimitSeconds.create(time).chain(timeVO =>
            this.wrapOptional(pts, Points.create).chain(pointsVO =>
                this.wrapOptional(ques, Question.create).chain(quesVO =>
                    this.wrapOptional(img, ImageId.create).chain(imgVO =>
                        this.wrapOptional((desc?.trim()) ? desc : undefined, Description.create).map(descVO => ({
                            position: pos,
                            timeLimit: timeVO,
                            points: pointsVO,
                            question: quesVO,
                            slideImage: imgVO,
                            description: descVO,
                            options: opts.length > 0 ? new Optional(opts) : new Optional<Option[]>(undefined)
                        } as unknown as SlideProps))
                    )
                )
            )
        );
    }

    public static assembleStyling(themeId: string, imageId?: string): Either<ErrorData, KahootStyling> {
        return ThemeId.create(themeId).chain(tId => {
            const cleanImageId = (imageId?.trim()) ? imageId : undefined;
            return this.wrapOptional(cleanImageId, ImageId.create).chain(imgVO =>
                KahootStyling.create(imgVO, tId)
            );
        });
    }

    private static resolveSlideCreator(type: SlideTypeEnum): Either<ErrorData, any> {
        const creator = this.SlideCreatorsMap[type];
        if (!creator) {
            return Either.makeLeft(DomainErrorFactory.validation(
                createDomainContext('KahootFactory', 'Factory'),
                { slideType: ['UNKNOWN_TYPE'] },
                `The slide type "${type}" is not registered.`
            ));
        }
        return Either.makeRight(creator);
    }

    public static processSlides<T>(
        items: T[] | undefined,
        mapper: (item: T, pos: number) => Either<ErrorData, Slide>
    ): Either<ErrorData, Map<SlideIdValue, Slide>> {
        const map = new Map<SlideIdValue, Slide>();
        if (!items) return Either.makeRight(map);
        for (const [idx, item] of items.entries()) {
            const res = mapper(item, idx);
            if (res.isLeft()) return Either.makeLeft(res.getLeft());
            const slide = res.getRight();
            map.set(slide.id.value, slide);
        }
        return Either.makeRight(map);
    }

    public static assembleDetails(t?: string, d?: string, c?: string): Optional<KahootDetails> {
        if (!t && !d && !c) return new Optional<KahootDetails>();
        return new Optional(new KahootDetails(
            new Optional(t?.trim() || undefined),
            new Optional(d?.trim() || undefined),
            new Optional(c?.trim() || undefined)
        ));
    }
}