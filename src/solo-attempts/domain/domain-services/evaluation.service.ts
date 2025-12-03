import { SoloAttempt } from "../aggregates/attempt";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";

// Service responsible for evaluating a player's answer submission
// within a solo Kahoot attempt.
// It interacts with both the SoloAttempt and Kahoot aggregates. 
// The kahoot processes the answers and provides the result. 
// while the SoloAttempt records the outcome and updates the game state.
// It ensures that scoring rules are applied and the game state advances correctly.
export class SoloAttemptEvaluationService {

  // We inject the aggregates required for evaluation. This ensures the service 
  // We also receive the submission parameter object encapsulating the player's answers.
  // These are injected by the application layer. Which loads the aggregates from the repositories.
  public evaluate(kahoot: Kahoot, attempt: SoloAttempt, submission: Submission): void {

    // Cross-Aggregate Invariant Checks:
    
    // We make sure the kahoot and attempt correspond.
    if (!attempt.kahootId.equals(kahoot.id)) {
      throw new Error("The attempt does not correspond to the provided Kahoot.");
    }

    // We check that the slide being answered is the next one in the attempt's progress.
    const slide_id_of_new_answer = submission.getSlideId();
    const position_of_next_slide_in_attempt = attempt.progress.questionsAnswered;
    const slide_snapshot_of_new_answer = kahoot.getSlideSnapshotById(slide_id_of_new_answer); 
    if (slide_snapshot_of_new_answer === null) {
      throw new Error("The slide being answered does not exist in the Kahoot.");
    }
    else if (slide_snapshot_of_new_answer.position !== position_of_next_slide_in_attempt) {
      throw new Error("The slide being answered is not the next one in the attempt's progress.");
    }

    // If the kahoot is in draft mode you can't continue playing 
    if (kahoot.isDraft()){
      throw new Error("Cannot evaluate answers for an attempt on a Kahoot that is in draft mode.");
    }

    // The other invariant checks are aggregate-only and will be done internally.

    // We delegate the calculation of correctness and points to the Kahoot aggregate.
    // The Kahoot knows the correct options and the scoring strategy.
    // It will return a Result parameter object encapsulating the outcome 
    // and data snapshots of the question and answers.
    const result = kahoot.evaluateAnswer(submission);

    // We register the result into the player's attempt. This records the answer data and snapshots,
    // updates the total score, audits timestamps, and updates the progress (questions answered).
    // If all questions have been answered, the attempt status is also updated to completed.
    // and all completion logic is handled (e.g., events, completion timestamp, summary calculations).
    // Invariants checks and state updates are all encapsulated within the aggregate as well. 
    // It all originates from this aggregate method. 
    // (Which also calls other aggregate methods when needed obviously).
    attempt.registerAnswer(result);

  }
}