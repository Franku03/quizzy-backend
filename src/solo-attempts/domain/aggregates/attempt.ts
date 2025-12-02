import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { AttemptStatus } from "../value-objects/attempt.status";
import { AttemptProgress } from "../value-objects/attempt.progress";
import { AttemptTimeDetails } from "../value-objects/attempt.time-details";
import { PlayerAnswer } from "../value-objects/attempt.player-answer";
import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { SoloAttemptCompletedEvent } from "src/core/domain/domain-events/attempt-completed-event";

// This interface acts as the definitive contract for the state of a SoloAttempt.
// It groups together the identity, the link to the original Kahoot, the player involved,
// and the mutable state regarding their performance and progress.
export interface SoloAttemptProps {
    readonly id: AttemptId;
    readonly kahootId: KahootId;
    readonly playerId: UserId;
    // The current state of the game (IN_PROGRESS or COMPLETED).
    status: AttemptStatus;
    // The accumulated score based on correctness and speed. 
    totalScore: Score;
    // Tracks how many questions have been answered relative to the total.
    progress: AttemptProgress;
    // Encapsulates temporal aspects of an attempt: startTime/lastInteraction/completionTime.
    timeDetails: AttemptTimeDetails;
    // A collection of all answers submitted by the player so far.
    answers: PlayerAnswer[];
}

// The SoloAttempt Aggregate Root serves as the consistency boundary 
// for a single player's game session.
// It is responsible for orchestrating the flow of the game, validating state transitions,
// and ensuring that scoring rules are applied consistently before saving changes.
export class SoloAttempt extends AggregateRoot<SoloAttemptProps, AttemptId> {

    // Internal list to buffer domain events that occur during the lifecycle of the aggregate.
    // These events are not persisted directly in the entity's table but are intended
    // to be dispatched by the repository transaction after the state is successfully saved.
    private domainEvents: DomainEvent[] = [];

    // We initialize the aggregate by passing the properties and the specific AttemptId
    // up to the base AggregateRoot. This ensures the base class can manage the identity
    // and the immutable properties correctly.
    public constructor(props: SoloAttemptProps) {
        super(props, props.id);
        this.checkInvariants();
    }

    // We process the result of a player's submission for a specific slide.
    // This method is the heart of the gameplay loop, it records the player's answer,
    // updates their total score if the answer was correct, advances the game progress
    // counter, and refreshes the audit timestamps.
    // It also enforces business rules such as preventing answers on completed attempts
    // and avoiding duplicate answers for the same question.
    public registerAnswer(result: Result): void {
        if (!this.isInProgress()) {
            throw new Error("Cannot register answers for a completed or non-active attempt.");
        }

        // The position of the new answer is determined by the current progress.
        // Since progress counts how many questions have been answered, 
        // the next position is simply that count plus one.
        // Example: (0 answered -> this is answer #1), (5 answered -> this is answer #6).
        const currentPosition = this.properties.progress.questionsAnswered + 1;

        // We map the transient Result parameter object into a persistent PlayerAnswer Value Object.
        // This encapsulates all the details of the player's submission.
        const newAnswer = PlayerAnswer.create(result, currentPosition);

        // Duplicate answers are prevented by ensuring the user hasn't already submitted 
        // an answer for this specific slide.
        if (this.isSlideAnswered(newAnswer.slideId)) {
            throw new Error("Answer for this slide has already been registered.");
        }

        // The answer is recorded in the history.
        this.properties.answers.push(newAnswer);

        // If the player earned points, they are added to the aggregate total.
        // The addition logic is delegated to the Score Value Object to ensure immutability rules.
        if (newAnswer.earnedScore.getScore() > 0) {
            this.properties.totalScore = this.properties.totalScore.addScore(
                newAnswer.earnedScore
            );
        }

        // The counter of answered questions is incremented.
        this.properties.progress = this.properties.progress.addAnswer();

        // The activity timestamp is updated to mark this interaction as the latest activity.
        this.properties.timeDetails = this.properties.timeDetails.continueAt(new Date());
    }

    // We signal that the user has resumed their session after a pause.
    // This method updates the 'lastPlayedAt' timestamp to the current moment.
    public continueAttempt(): void {
        // We cannot continue a game that has already finished.
        if (this.isCompleted()) {
            throw new Error("Cannot continue a completed attempt.");
        }

        // We delegate the responsibility of handling the specific date update to the Value Object,
        // The 'continueAt' method returns a new instance of TimeDetails with the updated timestamp.
        this.properties.timeDetails = this.properties.timeDetails.continueAt(new Date());
    }

    // We finalize the single player session.
    // This method transitions the state to COMPLETED
    // seals the audit logs with the final timestamp,
    // and produces a Domain Event to notify external modules (like the Group module 
    // about the game results. 
    // Group Module need this event to register/process kahoot assignements 
    // (which are completed via soloAttempts).  
    public completeAttempt(): void {
        if (this.isCompleted()) {
            throw new Error("Attempt is already completed.");
        }

        const completionDate = new Date();

        // Update Status
        // We mark the attempt as finished so no further answers can be processed.
        this.properties.status = AttemptStatus.COMPLETED;

        // Update Time Logic 
        // We finalize the time tracking by setting the completion date in the value object.
        this.properties.timeDetails = this.properties.timeDetails.complete(completionDate);

        // Prepare Statistics for the Event
        // We calculate the necessary metrics that the event subscribers need.
        const totalQuestions = this.properties.progress.totalQuestions;
        const correctAnswersCount = this.getNumberOfCorrectAnswers();
        const accuracy = this.getAccuracyPercentage();

        // Create the Domain Event
        // We instantiate the event directly with our Value Objects. 
        const completionEvent = new SoloAttemptCompletedEvent(
            this.id,
            this.properties.playerId,
            this.properties.kahootId,
            this.properties.totalScore,
            accuracy,
            correctAnswersCount,
            totalQuestions
        );

        // Record the Event
        // We add the event to the aggregate's internal list for future publication.
        // The publication will be done by the repository after persisting changes.
        this.record(completionEvent);
    }

    // We check if the attempt is still active. 
    // This state implies the player has not yet answered all questions.
    // They should be allowed to continue playing.
    public isInProgress(): boolean {
        return this.properties.status === AttemptStatus.IN_PROGRESS;
    }

    // Indicates if the attempt has been completed.
    // Once an attempt is completed, no further answers can be accepted, and the
    // system is ready to display the final summary and statistics.
    public isCompleted(): boolean {
        return this.properties.status === AttemptStatus.COMPLETED;
    }

    // We calculate the total count of questions the player has successfully answered.
    // It serves as a fundamental metric for the final game summary and accuracy calculations.
    public getNumberOfCorrectAnswers(): number {
        return this.properties.answers.filter((answer) => answer.isCorrect()).length;
    }

    // Calculates the player's performance accuracy as a percentage (0-100).
    // This value is required for the final summary screen. 
    public getAccuracyPercentage(): number {
        const totalQuestions = this.properties.progress.totalQuestions;

        // Even though it should never happen 
        // we handle the edge case where there are no questions for extra safety.
        if (totalQuestions === 0) {
            return 0;
        }

        // Calculate the number of correct answers using the dedicated method
        const correctAnswersCount = this.getNumberOfCorrectAnswers();

        return (correctAnswersCount / totalQuestions) * 100;
    }

    // We determine if a specific slide has already been processed by the player.
    // This check is essential to enforce the rule that each question in a Single Player
    // session can only be answered once. 
    public isSlideAnswered(slideId: SlideId): boolean {
        // We use the 'some' method to efficiently check for the existence of the slide ID
        return this.properties.answers.some((answer) => 
            answer.slideId.equals(slideId)
        );
    }

    // Retrieves the SlideId of the current question the player is on.
    // This is essential for resuming games and displaying the correct question.
    public getCurrentSlideId(): SlideId {
        // We verify if there are any answers recorded. If the attempt is brand new 
        // and no answers exist, we cannot return a "current" slide ID from history.
        if (this.properties.answers.length === 0) {
            throw new Error("Cannot retrieve current slide ID: No answers recorded yet.");
        }

        // We iterate through the existing answers to find the one with the highest position.
        // This answer corresponds to the most recently answered question.
        const latestAnswer = this.properties.answers.reduce((latest, current) => 
            (current.SlidePosition > latest.SlidePosition) ? current : latest
        );

        return latestAnswer.slideId;
    }

    // Retrieves the PlayerAnswer associated with a specific SlideId.
    public getPlayerAnswerBySlideId(slideId: SlideId): PlayerAnswer {
        // find method returns the first element that satisfies the condition
        const answer = this.properties.answers.find((a) => a.slideId.equals(slideId));
        if (!answer) {
            throw new Error(`Answer for slide with ID ${slideId.value} not found.`);
        }

        return answer;
    }

    // Retrieves the most recent PlayerAnswer submitted by the player.
    public getLastPlayerAnswer(): PlayerAnswer {
        if (this.properties.answers.length === 0) {
            throw new Error("Cannot retrieve last answer: No answers recorded yet.");
        }
        
        // We traverse the list to find the answer with the highest position value.
        return this.properties.answers.reduce((latest, current) => 
            (current.SlidePosition > latest.SlidePosition) ? current : latest
        );
    }

    // We validate the internal consistency of the aggregate boundaries.
    // This method ensures that the separate pieces of state (Progress, Score, Status, Answers)
    // are mathematically and logically synchronized. It guards against corrupt data
    // entering the system via the constructor or persistence layer.
    protected checkInvariants(): void {
        // Progress-Answers Synchronization:
        // The counter in the Progress Value Object must exactly match the number of answer entities stored.
        // If these differ, it implies data corruption where an answer was lost or the counter drifted.
        if (this.properties.progress.questionsAnswered !== this.properties.answers.length) {
            throw new Error(
                `Invariant Violation: Progress count (${this.properties.progress.questionsAnswered}) does not match answers count (${this.properties.answers.length}).`
            );
        }

        // Score-Answers Synchronization:
        // The aggregated 'totalScore' property acts as a cache. It must equal the sum of
        // the individual scores from all recorded answers.
        // We recalculate the sum from the history to verify the cached value is correct.
        const calculatedTotalScore = this.properties.answers.reduce(
            (sum, answer) => sum + answer.earnedScore.getScore(),
            0
        );

        if (this.properties.totalScore.getScore() !== calculatedTotalScore) {
            throw new Error(
                `Invariant Violation: Stored total score (${this.properties.totalScore.getScore()}) does not match calculated sum of answer scores (${calculatedTotalScore}).`
            );
        }

        // Completion State Consistency:
        // If the attempt is marked as COMPLETED, strict rules apply:
        // 1. All questions must have been answered.
        // 2. The audit trail must contain a completion timestamp.
        if (this.properties.status === AttemptStatus.COMPLETED) {
            
            if (this.properties.progress.questionsAnswered !== this.properties.progress.totalQuestions) {
                throw new Error("Invariant Violation: Attempt is COMPLETED but not all questions are answered.");
            }

            // We check the TimeDetails Value Object to ensure the 'completedAt' field is present.
            // (Assuming TimeDetails exposes a method to check this, based on the Optional<Date> definition).
            if (!this.properties.timeDetails.completedAt.hasValue()) {
                throw new Error("Invariant Violation: Attempt is COMPLETED but lacks a completion timestamp.");
            }
        }

        // Active State Consistency:
        // Conversely, if the attempt is IN_PROGRESS, it must NOT have a completion timestamp.
        if (this.properties.status === AttemptStatus.IN_PROGRESS) {
            if (this.properties.timeDetails.completedAt.hasValue()) {
                throw new Error("Invariant Violation: Attempt is IN_PROGRESS but has a completion timestamp.");
            }
        }

        // Additional invariants can be added here as the domain evolves.
    }

    // We register a new domain event to be published later.
    // This method is protected because only the aggregate itself should know when
    // a significant business rule has been satisfied and an event needs to be emitted.
    protected record(event: DomainEvent): void {
        this.domainEvents.push(event);
    }

    // We retrieve and clear the list of pending domain events.
    // This method is called by the Repository
    // immediately after persisting the aggregate state, ensuring that events are only
    // published if the data change was successful.
    public pullDomainEvents(): DomainEvent[] {
        // We create a shallow copy of the current events to return
        const events = this.domainEvents.slice();
        // We clear the internal list to avoid re-publishing the same events
        this.domainEvents = [];
        return events;
    }

    // getters

    // Provides the status ( determines if the game is in progress or completed )
    public get status(): AttemptStatus {
        return this.properties.status;
    }

    // Provides the total score accumulated by the player so far
    public get totalScore(): Score {
        return this.properties.totalScore;
    }
    
    // Provides a shallow copy of the answers array to prevent external modification
    public get answers(): PlayerAnswer[] {
        return [...this.properties.answers];
    }

    // Provides the progress object that tracks how many questions have been answered
    public get progress(): AttemptProgress {
        return this.properties.progress;
    }

    // Provides the time details object that encapsulates temporal aspects of the attempt
    public get timeDetails(): AttemptTimeDetails {
        return this.properties.timeDetails;
    }

    // Provides the KahootId associated with this attempt
    public get kahootId(): KahootId {
        return this.properties.kahootId;
    }

    // Provides the UserId of the player undertaking this attempt
    public get playerId(): UserId {
        return this.properties.playerId;
    }

    // Provides the AttemptId of this solo attempt    
    public get attemptId(): AttemptId {
        return this.properties.id;
    }

}