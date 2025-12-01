import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { QuestionSnapshot } from "src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { AnswerSelected } from "src/core/domain/shared-value-objects/value-objects/value.object.answer-selected";
import { QuestionSnapshotFactory } from "src/core/domain/factories/question-snapshot.factory";
import { mapToAnswerSelected } from "src/core/domain/helpers/map-option-to-answer-selected";

interface PlayerAnswerProps {
    slideId: SlideId;
    answerIndex: Optional<number[]>;
    isAnswerCorrect: boolean;
    earnedScore: Optional<Score>;
    timeElapsed: ResponseTime;
    answerContent: Optional<AnswerSelected[]>;
    questionSnapshot: QuestionSnapshot;
}

export class PlayerAnswer extends ValueObject<PlayerAnswerProps> {

    private constructor(props: PlayerAnswerProps) {
        super(props);

        //  If answerContent is empty (user timeout), the timeElapsed must be equal to the question's timeLimit.
        if (!props.answerContent.hasValue()) {
            // We get the time limit from the question snapshot
            const questionTimeLimit = props.questionSnapshot.timeLimit.value;
            // We convert the timeElapsed to seconds for comparison 
            // (timeLimit VO is stored in seconds)
            const elapsedSeconds = props.timeElapsed.toSeconds();

            if (elapsedSeconds !== questionTimeLimit) {
                throw new Error("If no answer is provided (timeout), the time elapsed must equal the question time limit.");
            }
        }
    }

    // Factory method to create a PlayerAnswer from the given evaluation Result.
    // This maps the transient 'Result' parameter object into a persisted Value Object.
    public static create(result: Result): PlayerAnswer {
        // We extract the player submission data associated with the result
        const submission = result.getSubmission();
    
        // We create a snapshot of the question to capture its state at the time of answering.
        // This ensures historical accuracy even if the Kahoot is modified later.
        const questionSnapshot = QuestionSnapshotFactory.createQuestionSnapshotFromResult(result);

        // TODO: Si accedemos al Option directamente quitamos esto
        // Mapeamos las option de la submission a AnswerSelected, nuestro VO para almacenar los datos la option seleccionada por el usuario
        const answerContent = mapToAnswerSelected( submission );
        
        // Finally, we create and return the PlayerAnswer Value Object
        return new PlayerAnswer({
            slideId: submission.getSlideId(),
            answerIndex: submission.getAnswerIndex(),
            isAnswerCorrect: result.isCorrect(),
            earnedScore: result.getScore(),
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
        return this.properties.answerIndex.hasValue() && this.properties.answerIndex.getValue().length > 0;
    }

    // Getters
    public get slideId(): SlideId {
        return this.properties.slideId;
    }

    public get answerIndex(): Optional<number[]> {
        return this.properties.answerIndex;
    }

    public get earnedScore(): Optional<Score> {
        return this.properties.earnedScore;
    }

    public get timeElapsed(): ResponseTime {
        return this.properties.timeElapsed;
    }

    public get answerContent(): Optional<AnswerSelected[]> {
        return this.properties.answerContent;
    }

    public get questionSnapshot(): QuestionSnapshot {
        return this.properties.questionSnapshot;
    }
}