import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { QuestionSnapshot } from "src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { AnswerSelected } from "src/core/domain/shared-value-objects/value-objects/value.object.answer-selected";
import { QuestionSnapshotFactory } from "src/core/domain/factories/question-snapshot.factory";

interface PlayerAnswerProps {
    slideId: SlideId;
    SlidePosition: number;
    answerIndex: number[];
    isAnswerCorrect: boolean;
    earnedScore: Score;
    timeElapsed: ResponseTime;
    answerContent: AnswerSelected[];
    questionSnapshot: QuestionSnapshot;
}

export class PlayerAnswer extends ValueObject<PlayerAnswerProps> {

    public constructor(props: PlayerAnswerProps) {
        super(props);

        // Position must be a natural non-zero number (1, 2, ...)
        if (props.SlidePosition < 1 || !Number.isInteger(props.SlidePosition)) {
            throw new Error("The position of the PlayerAnswer must be a natural number (1, 2, 3, ...).");
        }

        // Time validation logic for PlayerAnswer

        //  If answerContent is empty (user timeout)
        //  the player's timeElapsed must be equal to the question's timeLimit.
        if (props.answerContent.length === 0) {
            // We get the time limit from the question snapshot
            const questionTimeLimit = props.questionSnapshot.timeLimit.value;
            // We convert the timeElapsed to seconds for comparison 
            // (timeLimit VO is stored in seconds)
            const elapsedSeconds = props.timeElapsed.toSeconds();

            if (elapsedSeconds !== questionTimeLimit) {
                throw new Error("If no answer is provided (timeout), the time elapsed must equal the question time limit.");
            }
        }

        // If answerContent is not empty (user answered)
        // the player's timeElapsed must be less than or equal to the question's timeLimit.
        else {
            const questionTimeLimit = props.questionSnapshot.timeLimit.value;
            const elapsedSeconds = props.timeElapsed.toSeconds();
            if (elapsedSeconds > questionTimeLimit) {
                throw new Error("The time elapsed cannot exceed the question time limit.");
            }
        }

        // Answer validation logic for PlayerAnswer

        // If player did not select any answer (timeout),
        // the answerIndex array must be empty.
        if (props.answerContent.length === 0 && props.answerIndex.length > 0) {
            throw new Error("If no answer is provided (timeout), the answer index array must be empty.");
        }
 
        // If player selected an answer,
        // the answerIndex array must not be empty.
        if (props.answerContent.length > 0 && props.answerIndex.length === 0) {
            throw new Error("If an answer is provided, the answer index array must not be empty.");
        }

        // if the answer is incorrect, the earned score must be zero.
        if (!props.isAnswerCorrect && props.earnedScore.getScore() !== 0) {
            throw new Error("If the answer is incorrect, the earned score must be zero.");
        }

    }

    // Factory method to create a PlayerAnswer from the given evaluation Result.
    // This maps the temporary Result parameter object into a persisted Value Object.
    public static create(result: Result, SlidePosition: number): PlayerAnswer {
        // We extract the player submission data associated with the result
        const submission = result.getSubmission();
    
        // We create a snapshot of the question to capture its state at the time of answering.
        // This ensures historical accuracy even if the Kahoot is modified later.
        const questionSnapshot = QuestionSnapshotFactory.createQuestionSnapshotFromResult(result);

        // Mapeamos las option de la submission a AnswerSelected
        // Este VO para almacena los datos la option seleccionada por el usuario
        // Es util para reportes y analiticas posteriores
        const answerContent = AnswerSelected.createFromOptions( submission );
        
        // Finally, we create and return the PlayerAnswer Value Object
        return new PlayerAnswer({
            slideId: submission.getSlideId(),
            SlidePosition: SlidePosition,
            answerIndex: submission.getAnswerIndex().hasValue() ? submission.getAnswerIndex().getValue() : [],
            isAnswerCorrect: result.isCorrect(),
            earnedScore: result.getScore().hasValue() ? result.getScore().getValue() : Score.create( 0 ),
            timeElapsed: submission.getTimeElapsed(),
            answerContent: answerContent,
            questionSnapshot: questionSnapshot
        });
    }

    // Business logic methods

    // Indicates if the player's answer was correct
    public isCorrect(): boolean {
        return this.properties.isAnswerCorrect;
    }

    // Indicates if the player selected any answer (as opposed to timing out)
    public didPlayerSelectAnswer(): boolean {
        return this.properties.answerIndex.length > 0;
    }

    // Getters
    public get slideId(): SlideId {
        return this.properties.slideId;
    }

    public get answerIndex(): number[] {
        return this.properties.answerIndex;
    }

    public get earnedScore(): Score {
        return this.properties.earnedScore;
    }

    public get timeElapsed(): ResponseTime {
        return this.properties.timeElapsed;
    }

    public get answerContent(): AnswerSelected[] {
        return this.properties.answerContent;
    }

    public get questionSnapshot(): QuestionSnapshot {
        return this.properties.questionSnapshot;
    }

    public get SlidePosition(): number {
        return this.properties.SlidePosition;
    }
}