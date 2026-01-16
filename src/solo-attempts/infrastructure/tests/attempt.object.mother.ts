// src/solo-attempts/tests/mothers/solo-attempt.mother.ts
import { SoloAttempt } from "src/solo-attempts/domain/aggregates/attempt";
import { SoloAttemptProps } from "src/solo-attempts/domain/aggregates/attempt";
import { AttemptId } from "src/core/domain/shared-value-objects/id-objects/singleplayer-attempt.id";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { Score } from "src/core/domain/shared-value-objects/value-objects/value.object.score";
import { AttemptProgress } from "src/solo-attempts/domain/value-objects/attempt.progress";
import { AttemptTimeDetails } from "src/solo-attempts/domain/value-objects/attempt.time-details";
import { PlayerAnswer } from "src/solo-attempts/domain/value-objects/attempt.player-answer";
import { AttemptStatus } from "src/solo-attempts/domain/value-objects/attempt.status";
import { SlideId } from "src/core/domain/shared-value-objects/id-objects/kahoot.slide.id";
import { ResponseTime } from "src/core/domain/shared-value-objects/value-objects/value.object.response-time";
import { QuestionSnapshot } from "src/core/domain/shared-value-objects/value-objects/value.object.question-snapshot";
import { AnswerSelected } from "src/core/domain/shared-value-objects/value-objects/value.object.answer-selected";
import { Optional } from "src/core/types/optional";
import { ImageId } from "src/core/domain/shared-value-objects/id-objects/image.id";
import { Either } from "src/core/types/either";
import { Points } from "src/core/domain/shared-value-objects/value-objects/value.object.points";

// Helper to create valid dates for testing
const createTestDate = (minutesAgo: number): Date => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date;
};

// Update your attempt.object.mother.ts - fix the createTestPlayerAnswer function
const createTestPlayerAnswer = (
  slideId: string,
  position: number,
  isCorrect: boolean,
  points: number = 0,
  answered: boolean = true
): PlayerAnswer => {
  const slideIdObj = new SlideId(slideId);
  const score = Score.create(isCorrect ? points : 0);
  
  // Create response time (less than time limit if answered)
  const timeLimit = 30; // 30 seconds per question
  const timeElapsed = answered 
    ? new ResponseTime(Math.floor(Math.random() * 25) + 1) // 1-25 seconds if answered
    : new ResponseTime(timeLimit); // Full time if timeout
  
  // Create Points correctly - Points.create returns Either<Error, Points>
  const pointsResult = Points.create(points);
  if (pointsResult.isLeft()) {
    throw new Error(`Invalid points: ${pointsResult.getLeft().message}`);
  }
  const validPoints = pointsResult.getRight();
  
  // Create question snapshot (simplified for testing)
  const questionSnapshot: QuestionSnapshot = new QuestionSnapshot({
    questionText: "Sample Question?",
    basePoints: validPoints, // Use the valid Points from Either
    timeLimit: { value: timeLimit } as any, // Mocked TimeLimitSeconds
  });
  
  // Create answer content based on correctness
  let answerContent: AnswerSelected[] = [];
  if (answered) {
    if (isCorrect) {
      // Correct answer selects option 0
      answerContent = [AnswerSelected.createFromText("Option A", true)];
    } else {
      // Incorrect answer selects option 1
      answerContent = [AnswerSelected.createFromText("Option B", false)];
    }
  } else {
    // Timeout - no answer content
    answerContent = [];
  }
  
  return new PlayerAnswer({
    slideId: slideIdObj,
    SlidePosition: position,
    answerIndex: answered ? (isCorrect ? [0] : [1]) : [],
    isAnswerCorrect: isCorrect,
    earnedScore: score,
    timeElapsed: timeElapsed,
    answerContent: answerContent,
    questionSnapshot: questionSnapshot,
  });
};

export class SoloAttemptMother {
  /**
   * Creates a completed SoloAttempt with perfect score
   */
  public static createPerfectAttempt(): SoloAttempt {
    const totalQuestions = 5;
    const answers: PlayerAnswer[] = [];
    
    // Create 5 correct answers
    for (let i = 1; i <= totalQuestions; i++) {
      answers.push(createTestPlayerAnswer(`slide-perfect-${i}`, i, true, 20, true));
    }
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.earnedScore.getScore(), 0);
    
    const props: SoloAttemptProps = {
      id: new AttemptId("perfect-attempt-001"),
      kahootId: new KahootId("kahoot-perfect-001"),
      playerId: new UserId("user-expert-001"),
      totalScore: Score.create(totalScore),
      progress: AttemptProgress.create(totalQuestions, totalQuestions),
      timeDetails: AttemptTimeDetails.create(createTestDate(60))
        .continueAt(createTestDate(10))
        .complete(createTestDate(5)),
      answers: answers,
      status: AttemptStatus.createCompleted(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates a completed SoloAttempt with mixed results (some correct, some incorrect)
   */
  public static createMixedAttempt(): SoloAttempt {
    const totalQuestions = 10;
    const answers: PlayerAnswer[] = [];
    
    // Add 7 correct answers
    for (let i = 1; i <= 7; i++) {
      answers.push(createTestPlayerAnswer(`slide-correct-${i}`, i, true, 10, true));
    }
    
    // Add 3 incorrect answers
    for (let i = 8; i <= 10; i++) {
      answers.push(createTestPlayerAnswer(`slide-incorrect-${i}`, i, false, 10, true));
    }
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.earnedScore.getScore(), 0);
    
    const props: SoloAttemptProps = {
      id: new AttemptId("mixed-attempt-002"),
      kahootId: new KahootId("kahoot-mixed-001"),
      playerId: new UserId("user-average-001"),
      totalScore: Score.create(totalScore),
      progress: AttemptProgress.create(totalQuestions, totalQuestions),
      timeDetails: AttemptTimeDetails.create(createTestDate(45))
        .continueAt(createTestDate(8))
        .complete(createTestDate(3)),
      answers: answers,
      status: AttemptStatus.createCompleted(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates an in-progress SoloAttempt (not completed yet)
   */
  public static createInProgressAttempt(): SoloAttempt {
    const totalQuestions = 15;
    const answers: PlayerAnswer[] = [];
    
    // Add 3 answers so far (2 correct, 1 incorrect)
    answers.push(createTestPlayerAnswer("slide-1", 1, true, 15, true));
    answers.push(createTestPlayerAnswer("slide-2", 2, false, 10, true));
    answers.push(createTestPlayerAnswer("slide-3", 3, true, 10, true));
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.earnedScore.getScore(), 0);
    
    const props: SoloAttemptProps = {
      id: new AttemptId("progress-attempt-003"),
      kahootId: new KahootId("kahoot-progress-001"),
      playerId: new UserId("user-active-001"),
      totalScore: Score.create(totalScore),
      progress: AttemptProgress.create(totalQuestions, 3), // 3 answered, 12 remaining
      timeDetails: AttemptTimeDetails.create(createTestDate(30))
        .continueAt(createTestDate(5)),
      answers: answers,
      status: AttemptStatus.createInProgress(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates a completed SoloAttempt with one timeout (no answer selected)
   */
  public static createAttemptWithTimeout(): SoloAttempt {
    const totalQuestions = 3;
    const answers: PlayerAnswer[] = [];
    
    // Two correct answers
    answers.push(createTestPlayerAnswer("slide-1", 1, true, 10, true));
    answers.push(createTestPlayerAnswer("slide-2", 2, true, 10, true));
    
    // One timeout (no answer selected)
    answers.push(createTestPlayerAnswer("slide-3", 3, false, 10, false));
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.earnedScore.getScore(), 0);
    
    const props: SoloAttemptProps = {
      id: new AttemptId("timeout-attempt-004"),
      kahootId: new KahootId("kahoot-timeout-001"),
      playerId: new UserId("user-slow-001"),
      totalScore: Score.create(totalScore),
      progress: AttemptProgress.create(totalQuestions, totalQuestions),
      timeDetails: AttemptTimeDetails.create(createTestDate(40))
        .continueAt(createTestDate(15))
        .complete(createTestDate(5)),
      answers: answers,
      status: AttemptStatus.createCompleted(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates a completed SoloAttempt with zero score (all incorrect or timeouts)
   */
  public static createZeroScoreAttempt(): SoloAttempt {
    const totalQuestions = 4;
    const answers: PlayerAnswer[] = [];
    
    // All incorrect answers
    for (let i = 1; i <= totalQuestions; i++) {
      answers.push(createTestPlayerAnswer(`slide-zero-${i}`, i, false, 10, true));
    }
    
    const props: SoloAttemptProps = {
      id: new AttemptId("zero-attempt-005"),
      kahootId: new KahootId("kahoot-zero-001"),
      playerId: new UserId("user-beginner-001"),
      totalScore: Score.create(0),
      progress: AttemptProgress.create(totalQuestions, totalQuestions),
      timeDetails: AttemptTimeDetails.create(createTestDate(35))
        .continueAt(createTestDate(12))
        .complete(createTestDate(4)),
      answers: answers,
      status: AttemptStatus.createCompleted(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates a brand new SoloAttempt with no answers yet
   */
  public static createNewAttempt(): SoloAttempt {
    const totalQuestions = 10;
    
    const props: SoloAttemptProps = {
      id: new AttemptId("new-attempt-006"),
      kahootId: new KahootId("kahoot-new-001"),
      playerId: new UserId("user-new-001"),
      totalScore: Score.create(0),
      progress: AttemptProgress.create(totalQuestions, 0),
      timeDetails: AttemptTimeDetails.create(createTestDate(1)),
      answers: [],
      status: AttemptStatus.createInProgress(),
    };
    
    return new SoloAttempt(props);
  }
  
  /**
   * Creates a completed SoloAttempt with specific parameters for testing edge cases
   * @param attemptId - Optional attempt ID
   * @param kahootId - Optional kahoot ID
   * @param playerId - Optional player ID
   * @param correctAnswers - Number of correct answers
   * @param incorrectAnswers - Number of incorrect answers
   * @param pointsPerCorrect - Points per correct answer
   */
  public static createCustomCompletedAttempt(
    attemptId?: string,
    kahootId?: string,
    playerId?: string,
    correctAnswers: number = 3,
    incorrectAnswers: number = 2,
    pointsPerCorrect: number = 10
  ): SoloAttempt {
    const totalQuestions = correctAnswers + incorrectAnswers;
    const answers: PlayerAnswer[] = [];
    
    // Add correct answers
    for (let i = 1; i <= correctAnswers; i++) {
      answers.push(createTestPlayerAnswer(`slide-custom-correct-${i}`, i, true, pointsPerCorrect, true));
    }
    
    // Add incorrect answers
    for (let i = 1; i <= incorrectAnswers; i++) {
      const position = correctAnswers + i;
      answers.push(createTestPlayerAnswer(`slide-custom-incorrect-${i}`, position, false, pointsPerCorrect, true));
    }
    
    const totalScore = answers.reduce((sum, answer) => sum + answer.earnedScore.getScore(), 0);
    
    const props: SoloAttemptProps = {
      id: new AttemptId(attemptId || "custom-attempt-007"),
      kahootId: new KahootId(kahootId || "kahoot-custom-001"),
      playerId: new UserId(playerId || "user-custom-001"),
      totalScore: Score.create(totalScore),
      progress: AttemptProgress.create(totalQuestions, totalQuestions),
      timeDetails: AttemptTimeDetails.create(createTestDate(50))
        .continueAt(createTestDate(20))
        .complete(createTestDate(5)),
      answers: answers,
      status: AttemptStatus.createCompleted(),
    };
    
    return new SoloAttempt(props);
  }
}

// Convenience exports for common use cases
export const AttemptMother = {
  perfect: SoloAttemptMother.createPerfectAttempt,
  mixed: SoloAttemptMother.createMixedAttempt,
  inProgress: SoloAttemptMother.createInProgressAttempt,
  timeout: SoloAttemptMother.createAttemptWithTimeout,
  zeroScore: SoloAttemptMother.createZeroScoreAttempt,
  new: SoloAttemptMother.createNewAttempt,
  custom: SoloAttemptMother.createCustomCompletedAttempt,
};