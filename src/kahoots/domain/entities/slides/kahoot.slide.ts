// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { Optional } from "src/core/types/optional";
import { Entity } from "src/core/domain/abstractions/entity";

// --- Domain Models & VOs ---
import { Question } from "../../value-objects/kahoot.slide.question";
import { TimeLimitSeconds } from "src/core/domain/shared-value-objects/value-objects/value.object.time-limit-seconds";
import { Points } from "src/core/domain/shared-value-objects/value-objects/value.object.points";
import { SlideType } from "../../value-objects/kahoot.slide.type";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { Option } from "../../value-objects/kahoot.slide.option";
import { Description } from "../../value-objects/kahoot.slide.description";

// --- Parameters, Strategies & Snapshots ---
import { EvaluationStrategy } from "../../helpers/i-evalutaion.strategy";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { SlideSnapshot } from "src/core/domain/snapshots/snapshot.slide";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";
import { IDomainErrorContext } from "src/core/errors/interface/context/i-error-domain.context";

export interface SlideProps {
    position: number;
    slideType: SlideType;
    timeLimit: TimeLimitSeconds;
    question: Optional<Question>;
    slideImage: Optional<ImageId>;
    points: Optional<Points>;
    options: Optional<Option[]>;
    description: Optional<Description>
    evalStrategy: EvaluationStrategy;
}

export abstract class Slide extends Entity<SlideProps, SlideId> {

    protected constructor(props: SlideProps, id: SlideId) {
        super(props, id);
    }

    private getContext(operation: string): IDomainErrorContext {
        return createDomainContext(this.constructor.name, operation, {
            domainObjectKind: 'Entity',
            domainObjectId: this.id.value
        });
    }

    protected static checkBaseInvariants(props: SlideProps, className: string): Either<ErrorData, true> {
        const context = createDomainContext(className, 'checkBaseInvariants', {
            domainObjectKind: 'Entity'
        });

        if (props.position < 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { position: ['NEGATIVE_POSITION'] },
                "Slide position cannot be negative."
            ));
        }

        if (!props.slideType || !props.timeLimit) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { structure: ['MISSING_CORE_PROPS'] },
                "Slide must have a SlideType and TimeLimit defined."
            ));
        }

        return Either.makeRight(true);
    }

    public changePosition(newPosition: number): Either<ErrorData, void> {
        if (newPosition < 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                this.getContext('changePosition'),
                { position: ['NEGATIVE_POSITION'] },
                "The new position is not valid."
            ));
        }
        this.properties.position = newPosition;
        return Either.makeRight(undefined);
    }

    public updateQuestion(newQuestion: Optional<Question>): void {
        this.properties.question = newQuestion;
    }

    public updateSlideImage(newImageId: Optional<ImageId>): void {
        this.properties.slideImage = newImageId;
    }

    public updateTimeLimit(newTimeLimit: TimeLimitSeconds): void {
        this.properties.timeLimit = newTimeLimit;
    }

    public updatePoints(newPoints: Optional<Points>): Either<ErrorData, void> {
        this.properties.points = newPoints;
        return Either.makeRight(undefined);
    }
    public removeOptionByIndex(indexToDelete: number): Either<ErrorData, void> {
        const currentOptions = this.getOptionsList();

        if (indexToDelete < 0 || indexToDelete >= currentOptions.length) {
            return Either.makeLeft(DomainErrorFactory.validation(
                this.getContext('removeOption'),
                { options: ['OUT_OF_RANGE'] },
                "Option index out of range."
            ));
        }

        const newOptionsArray = currentOptions.filter((_, index) => index !== indexToDelete);
        this.properties.options = new Optional(newOptionsArray);
        return Either.makeRight(undefined);
    }

    public updateSlideType(newSlideType: SlideType): Either<ErrorData, void> {
        this.properties.slideType = newSlideType;
        return this.checkInitialInvariants();
    }

    public addOption(newOption: Option): Either<ErrorData, void> {
        return this.properties.slideType.canHaveOption()
            .chain(() => newOption.hasImage() ? this.properties.slideType.canHaveOptionImage() : Either.makeRight(true))
            .chain(() => {
                const currentOptions = this.getOptionsList();
                const newOptionsArray = [...currentOptions, newOption];
                return this.checkStructuralOptionLimits(newOptionsArray)
                    .map(() => {
                        this.properties.options = new Optional(newOptionsArray);
                    });
            });
    }

    public updateOption(indexToUpdate: number, newOption: Option): Either<ErrorData, void> {
        return this.properties.slideType.canHaveOption()
            .chain(() => newOption.hasImage() ? this.properties.slideType.canHaveOptionImage() : Either.makeRight(true))
            .chain(() => {
                const currentOptions = this.getOptionsList();
                if (indexToUpdate < 0 || indexToUpdate >= currentOptions.length) {
                    return Either.makeLeft(DomainErrorFactory.validation(
                        this.getContext('updateOption'),
                        { options: ['OUT_OF_RANGE'] },
                        "Option index out of range for update."
                    ));
                }
                const newOptionsArray = [...currentOptions];
                newOptionsArray[indexToUpdate] = newOption;
                this.properties.options = new Optional(newOptionsArray);
                return Either.makeRight(undefined);
            });
    }

    public changeDescription(newDescription: Description): Either<ErrorData, void> {
        return this.properties.slideType.canHaveDescription()
            .map(() => {
                this.properties.description = new Optional(newDescription);
            });
    }

    private checkStructuralOptionLimits(options: Option[]): Either<ErrorData, void> {
        const max = this.getMaxOptions();
        if (options.length > max) {
            return Either.makeLeft(DomainErrorFactory.validation(
                this.getContext('checkOptionLimits'),
                { options: ['LIMIT_EXCEEDED'] },
                `Maximum options exceeded. This slide type only allows ${max}.`
            ));
        }
        return Either.makeRight(undefined);
    }

    public evaluateAnswer(submission: Submission): Result {
        let selectedOptions: Optional<Option[]>;

        if (submission.getAnswerIndex().hasValue()) {
            const answerIndices = submission.getAnswerIndex().getValue();
            const allOptions = this.getOptionsList();
            const selected = answerIndices
                .filter(index => index >= 0 && index < allOptions.length)
                .map(index => allOptions[index]);

            selectedOptions = new Optional(selected);
        } else {
            selectedOptions = new Optional<Option[]>();
        }

        const newSubmission = new Submission(
            this.id,
            this.properties.question.hasValue()
                ? new Optional(this.properties.question.getValue().value)
                : new Optional<string>(),
            this.properties.points,
            new Optional(this.properties.timeLimit),
            selectedOptions,
            submission.getAnswerIndex(),
            submission.getTimeElapsed()
        );

        return this.properties.evalStrategy.evaluateAnswer(newSubmission, this.getOptionsList());
    }

    public getOptionsList(): Option[] {
        return this.properties.options.hasValue() ? this.properties.options.getValue() : [];
    }

    public isPublishingCompliant(): Either<ErrorData, void> {
        return this.validatePublishingInvariants();
    }

    protected abstract checkInitialInvariants(): Either<ErrorData, void>
    protected abstract validatePublishingInvariants(): Either<ErrorData, void>
    public abstract getMaxOptions(): number;
    public abstract changeEvaluationStrategy(newStrategy: EvaluationStrategy): Either<ErrorData, void>;

    public getSnapshot(): SlideSnapshot {
        const options = this.getOptionsList();
        
        return SlideSnapshot.fromRaw({
            id: this.id.value,
            position: this.properties.position,
            slideType: this.properties.slideType.type,
            timeLimitSeconds: this.properties.timeLimit.value,
            questionText: this.properties.question.hasValue() 
                ? this.properties.question.getValue().value 
                : undefined,
            slideImageId: this.properties.slideImage.hasValue() 
                ? this.properties.slideImage.getValue().value 
                : undefined,
            pointsValue: this.properties.points.hasValue() 
                ? this.properties.points.getValue().value 
                : undefined,
            descriptionText: this.properties.description.hasValue() 
                ? this.properties.description.getValue().description 
                : undefined,
            options: options.length > 0 
                ? options.map(option => option.getSnapshot()) 
                : undefined,
        });
    }

    public get idString(): string { return this.id.value; }
    public get slideType(): SlideType { return this.properties.slideType; }
    public get timeLimit(): TimeLimitSeconds { return this.properties.timeLimit; }
    public get question(): Optional<Question> { return this.properties.question; }
    public get slideImage(): Optional<ImageId> { return this.properties.slideImage; }
    public get options(): Optional<Option[]> { return this.properties.options; }
    public get points(): Optional<Points> { return this.properties.points; }
    public get position(): number { return this.properties.position; }
    public get description(): Optional<Description> { return this.properties.description; }
}