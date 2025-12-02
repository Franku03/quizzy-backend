// import { AggregateRoot } from "src/core/domain/abstractions/aggregate.root";
// import { Optional } from "src/core/types/optional";
// import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
// import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
// import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
// import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
// import { AttemptStatus } from "../value-objects/attempt.status";
// import { AttemptProgress } from "../value-objects/attempt.progress";
// import { AttemptTimeDetails } from "../value-objects/attempt.time-details";
// import { PlayerAnswer } from "../value-objects/attempt.player-answer";
// import { Result } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.result";
// import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";

// // Interface defining the properties state of the SoloAttempt Aggregate
// export interface SoloAttemptProps {
//     readonly kahootId: KahootId;
//     readonly playerId: UserId;
//     totalScore: Optional<Score>;
//     status: AttemptStatus;
//     progress: AttemptProgress;
//     timeDetails: AttemptTimeDetails;
//     answers: PlayerAnswer[];
// }

// export class SoloAttempt extends AggregateRoot<SoloAttemptProps, AttemptId> {

//     // Private constructor to enforce usage of Factory or specific creation methods if needed.
//     // However, for pure DDD, the Factory often calls this constructor.
//     private constructor(props: SoloAttemptProps, id: AttemptId) {
//         super(props, id);
//         this.checkInvariants();
//     }

//     /**
//      * Factory method to reconstitute the Aggregate from the repository.
//      * Use this when fetching an existing attempt from the database.
//      */
//     public static fromPrimitives(props: SoloAttemptProps, id: AttemptId): SoloAttempt {
//         return new SoloAttempt(props, id);
//     }

//     /**
//      * Creates a brand new SoloAttempt.
//      * Usually called by the SoloAttemptFactory.
//      */
//     public static create(
//         id: AttemptId,
//         kahootId: KahootId,
//         playerId: UserId,
//         totalQuestions: number
//     ): SoloAttempt {
//         const props: SoloAttemptProps = {
//             kahootId: kahootId,
//             playerId: playerId,
//             totalScore: new Optional<Score>(), // Starts empty/undefined
//             status: AttemptStatus.IN_PROGRESS,
//             progress: AttemptProgress.create(totalQuestions, 0),
//             timeDetails: AttemptTimeDetails.create(new Date()),
//             answers: []
//         };
        
//         const attempt = new SoloAttempt(props, id);
//         // Event: SoloAttemptCreated could be added here
//         return attempt;
//     }

//     // =========================================================================
//     // BUSINESS LOGIC METHODS
//     // =========================================================================

//     /**
//      * Registers a player's answer to a slide, updates the score, progress, and time details.
//      * * Ubiquitous Language:
//      * When a player submits an answer, the attempt must "register" it. This involves:
//      * 1. Validating the attempt is still in progress.
//      * 2. Checking if this slide was already answered to prevent duplicates.
//      * 3. Creating a PlayerAnswer record.
//      * 4. Accumulating points if the answer was correct.
//      * 5. Moving the progress forward.
//      * 6. Automatically completing the attempt if this was the last question.
//      * * @param result The result evaluated by the Domain Service containing submission and score data.
//      */
//     public registerAnswer(result: Result): void {
        
//         // Step 1: Guard clause - Cannot answer if attempt is not in progress
//         if (this.properties.status !== AttemptStatus.IN_PROGRESS) {
//             throw new Error("Cannot register answer. The attempt is not in progress.");
//         }

//         const slideId = result.getSubmission().getSlideId();

//         // Step 2: Guard clause - Prevent duplicate answers for the same slide
//         if (this.IsSlideAnswered(slideId)) {
//             throw new Error(`Slide ${slideId.value} has already been answered.`);
//         }

//         // Step 3: Create the PlayerAnswer entity from the Result
//         // Assuming PlayerAnswer.create transforms the Result parameter object into the Entity/VO
//         const newAnswer = PlayerAnswer.create(result);
//         this.properties.answers.push(newAnswer);

//         // Step 4: Update Score if applicable
//         // We use the Optional monad to handle potential score updates safely
//         if (result.score.hasValue()) {
//             const currentTotal = this.properties.totalScore.hasValue() 
//                 ? this.properties.totalScore.getValue() 
//                 : Score.create(0); // Assuming Score.create(0) initializes a zero score
            
//             // Add the new score to the total
//             const newTotal = currentTotal.addScore(result.score.getValue());
//             this.properties.totalScore = new Optional<Score>(newTotal);
//         }

//         // Step 5: Update Progress
//         // Increment the count of answered questions
//         this.properties.progress = this.properties.progress.addAnswer();

//         // Step 6: Update Time Details (Last played at)
//         this.continueAttempt();

//         // Step 7: Check for completion
//         // If all questions have been answered, we close the attempt
//         if (this.properties.progress.getQuestionsAnswered() >= this.properties.progress.getTotalQuestions()) {
//             this.completeAttempt();
//         }

//         // Domain Event: SoloAttemptAnswersSubmitted
//         // this.addDomainEvent(new SoloAttemptAnswersSubmitted(this.id, result));
//     }

//     /**
//      * Marks the attempt as finalized.
//      * * Ubiquitous Language:
//      * An attempt is "completed" when the user finishes all questions.
//      * This seals the attempt state, records the completion time, and potentially triggers
//      * the generation of the final summary.
//      */
//     public completeAttempt(): void {
//         if (this.properties.status === AttemptStatus.COMPLETED) {
//             return; // Idempotency: If already completed, do nothing.
//         }

//         this.properties.status = AttemptStatus.COMPLETED;
//         this.properties.timeDetails = this.properties.timeDetails.complete(new Date());

//         // Domain Event: SoloAttemptCompleted
//         /* this.addDomainEvent(new SoloAttemptCompleted(
//             this.id,
//             this.properties.playerId,
//             this.properties.kahootId,
//             this.properties.totalScore,
//             this.getAccuracyPercentage(),
//             this.getCorrectAnswerCount(),
//             this.properties.progress.getTotalQuestions()
//         )); 
//         */
//     }

//     /**
//      * Updates the 'lastPlayedAt' timestamp to now.
//      * * Ubiquitous Language:
//      * Used when a player resumes a session or submits an answer, indicating
//      * the attempt is still "active" and being worked on.
//      */
//     public continueAttempt(): void {
//         this.properties.timeDetails = this.properties.timeDetails.continueAt(new Date());
//     }

//     /**
//      * Checks if the attempt is currently active.
//      */
//     public isInProgress(): boolean {
//         return this.properties.status === AttemptStatus.IN_PROGRESS;
//     }

//     /**
//      * Checks if the attempt has finished.
//      */
//     public isCompleted(): boolean {
//         return this.properties.status === AttemptStatus.COMPLETED;
//     }

//     /**
//      * Calculates the percentage of correct answers against total answers submitted.
//      * Useful for the final summary.
//      * * @returns number (0-100)
//      */
//     public getAccuracyPercentage(): number {
//         const totalAnswered = this.properties.answers.length;
//         if (totalAnswered === 0) return 0;

//         const correctCount = this.properties.answers.filter(a => a.isCorrect()).length;
//         return (correctCount / totalAnswered) * 100;
//     }

//     /**
//      * Helper to get the absolute number of correct answers.
//      */
//     public getCorrectAnswerCount(): number {
//         return this.properties.answers.filter(a => a.isCorrect()).length;
//     }

//     /**
//      * Checks if a specific slide has already been answered by the player.
//      * * Ubiquitous Language:
//      * Essential for validation to ensure a player doesn't score the same question twice.
//      */
//     public IsSlideAnswered(slideId: SlideId): boolean {
//         return this.properties.answers.some(answer => answer.getSlideId().equals(slideId));
//     }

//     /**
//      * Retrieves all answers submitted by the player so far.
//      */
//     public getPlayerAnswers(): PlayerAnswer[] {
//         return [...this.properties.answers]; // Return a copy to preserve encapsulation
//     }

//     /**
//      * Retrieves a specific answer for a given slide ID.
//      * Useful for reviewing specific question results.
//      */
//     public getAnswerBySlideId(slideId: SlideId): Optional<PlayerAnswer> {
//         const answer = this.properties.answers.find(a => a.getSlideId().equals(slideId));
//         return new Optional<PlayerAnswer>(answer);
//     }

//     // =========================================================================
//     // INVARIANTS & GETTERS
//     // =========================================================================

//     /**
//      * Validates the consistency of the Aggregate's state.
//      * Must be called after construction or reconstitution.
//      */
//     protected checkInvariants(): void {
//         if (!this.properties.kahootId) {
//             throw new Error("SoloAttempt invariant violated: KahootId cannot be null.");
//         }
//         if (!this.properties.playerId) {
//             throw new Error("SoloAttempt invariant violated: PlayerId cannot be null.");
//         }
//         // Validate embedded VOs
//         // this.properties.timeDetails.validateInvariants(); 
        
//         // Logic invariant: Cannot have more answers than total questions
//         if (this.properties.progress.getQuestionsAnswered() > this.properties.progress.getTotalQuestions()) {
//              throw new Error("SoloAttempt invariant violated: Answered count exceeds total questions.");
//         }
//     }

//     // Getters 
    
//     public get kahootId(): KahootId {
//         return this.properties.kahootId;
//     }

//     public get playerId(): UserId {
//         return this.properties.playerId;
//     }

//     public get totalScore(): Optional<Score> {
//         return this.properties.totalScore;
//     }

//     public get status(): AttemptStatus {
//         return this.properties.status;
//     }

//     public get progress(): AttemptProgress {
//         return this.properties.progress;
//     }

//     public get timeDetails(): AttemptTimeDetails {
//         return this.properties.timeDetails;
//     }
// }