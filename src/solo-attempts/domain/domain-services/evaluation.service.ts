import { SoloAttempt } from "../aggregates/attempt";
import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { Submission } from "src/core/domain/shared-value-objects/parameter-objects/parameter.object.submission";
import { AttemptStatus } from "../value-objects/attempt.status";

// Service responsible for evaluating a player's answer submission
// within a solo Kahoot attempt.
// It interacts with both the SoloAttempt and Kahoot aggregates. 
// The kahoot processes the answers and provides the result. 
// while the SoloAttempt records the outcome and updates the game state.
// It ensures that scoring rules are applied and the game state advances correctly.
export class SoloAttemptEvaluationService {

  private attempt: SoloAttempt;
  private kahoot: Kahoot;

  // We inject the aggregates required for evaluation. This ensures the service 
  // has the full context of the current game state and the rules (Kahoot).
  // These are injected by the application layer. Which loads the aggregates from the repositories.
  constructor(attempt: SoloAttempt, kahoot: Kahoot) {
    this.attempt = attempt;
    this.kahoot = kahoot;
  }

  // Evaluates a player's submission against the rules of the Kahoot.
  // It updates the attempt with the result (correct/incorrect, points earned)
  // and determines if the attempt should be marked as completed.
  public evaluate(submission: Submission): void {

    // Cross-Service Invariant Check:
    
    // We make sure the kahoot and attempt correspond.
    if (!this.attempt.kahootId.equals(this.kahoot.id)) {
      throw new Error("The attempt does not correspond to the provided Kahoot.");
    }

    // We delegate the calculation of correctness and points to the Kahoot aggregate.
    // The Kahoot knows the correct options and the scoring strategy.
    // It will return a Result parameter object encapsulating the outcome 
    // and data snapshots of the question and answers.
    const result = this.kahoot.evaluateAnswer(submission);

    // We register the result into the player's attempt. This records the answer data and snapshots,
    // updates the total score, audits timestamps, and updates the progress (questions answered).
    // If all questions have been answered, the attempt status is also updated to completed.
    // and all completion logic is handled (e.g., events, completion timestamp, summary calculations).
    // Invariants checks and state updates are all encapsulated within the aggregate as well. 
    // It all originates from this aggregate method. 
    // (Which also calls other aggregate methods when needed obviously).
    this.attempt.registerAnswer(result);
  }
}