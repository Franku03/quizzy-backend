// src/solo-attempts/infrastructure/tests/attempt.testing.suite.ts
import { Test, TestingModule } from '@nestjs/testing';
import { GetAttemptSummaryTestBuilder } from './attempt.testing,api';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { SoloAttemptMother } from './attempt.object.mother';

describe('GetAttemptSummaryHandler', () => {
  let builder: GetAttemptSummaryTestBuilder;

  beforeEach(() => {
    builder = new GetAttemptSummaryTestBuilder();
  });

  afterEach(() => {
    builder.reset();
  });

  describe('Successful Scenarios', () => {
    it('should return summary for a completed attempt with mixed results', async () => {
      const attemptId = 'mixed-attempt-123';
      const userId = 'user-456';
      
      builder.givenACompletedAttemptExists(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenSummaryShouldHave(80, 8, 10, 80)
        .thenDaoShouldHaveBeenCalledWith(attemptId)
        .thenDaoShouldHaveBeenCalledOnce();
    });

    it('should return summary for a perfect score attempt', async () => {
      const attemptId = 'perfect-attempt-456';
      const userId = 'user-expert-789';
      
      builder.givenAPerfectScoreAttemptExists(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenSummaryShouldHave(100, 5, 5, 100)
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });

    it('should return summary for a zero score attempt', async () => {
      const attemptId = 'zero-attempt-789';
      const userId = 'user-beginner-123';
      
      builder.givenAZeroScoreAttemptExists(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenSummaryShouldHave(0, 0, 4, 0)
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });

    it('should return specific summary when configured', async () => {
      const attemptId = 'custom-attempt-999';
      const userId = 'user-test-999';
      const customSummary = new AttemptSummaryReadModel(
        attemptId,
        150, // final score
        15,  // correct answers
        20,  // total questions
        75   // 75% accuracy
      );
      
      // Updated: Now requires userId as second parameter
      builder.givenASpecificSummaryExists(attemptId, userId, customSummary);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenSummaryShouldBe(customSummary)
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw error when completed attempt is not found', async () => {
      const attemptId = 'non-existent-001';
      const userId = 'user-123';
      
      // Updated: Now requires userId as second parameter
      builder.givenNoSummaryExists(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenShouldThrowCompletedAttemptNotFoundError()
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });

    it('should throw error when attempt is in progress (not completed)', async () => {
      const attemptId = 'in-progress-002';
      const userId = 'user-456';
      
      // Updated: Now requires userId as second parameter
      builder.givenAnInProgressAttempt(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenShouldThrowCompletedAttemptNotFoundError()
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });

    it('should throw error when DAO throws unexpected error', async () => {
      const attemptId = 'error-attempt-003';
      const userId = 'user-789';
      const dbError = new Error('Database connection failed');
      
      // Updated: Now requires userId as second parameter
      builder.givenDaoThrowsError(attemptId, userId, dbError);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor
        .thenShouldThrowError(dbError)
        .thenDaoShouldHaveBeenCalledWith(attemptId);
    });
  });

  describe('Edge Cases', () => {
    it('should handle attempt with single question', async () => {
      const attemptId = 'single-question-001';
      const userId = 'user-single-001';
      const singleQuestionSummary = new AttemptSummaryReadModel(
        attemptId,
        20, // score for one correct answer
        1,  // correct
        1,  // total
        100 // accuracy
      );
      
      // Updated: Now requires userId as second parameter
      builder.givenASpecificSummaryExists(attemptId, userId, singleQuestionSummary);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor.thenSummaryShouldBe(singleQuestionSummary);
    });

    it('should handle attempt with all questions incorrect', async () => {
      const attemptId = 'all-incorrect-001';
      const userId = 'user-fail-001';
      const allIncorrectSummary = new AttemptSummaryReadModel(
        attemptId,
        0,   // score
        0,   // correct
        10,  // total
        0    // accuracy
      );
      
      // Updated: Now requires userId as second parameter
      builder.givenASpecificSummaryExists(attemptId, userId, allIncorrectSummary);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor.thenSummaryShouldBe(allIncorrectSummary);
    });

    it('should handle attempt with timeout answers (no answer selected)', async () => {
      const attemptId = 'timeout-attempt-001';
      const userId = 'user-slow-001';
      const timeoutSummary = new AttemptSummaryReadModel(
        attemptId,
        20,  // score for 2 correct answers
        2,   // correct (2 answered correctly)
        3,   // total (1 timeout is incorrect)
        66   // 66% accuracy (2/3)
      );
      
      // Updated: Now requires userId as second parameter
      builder.givenASpecificSummaryExists(attemptId, userId, timeoutSummary);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      executor.thenSummaryShouldHave(20, 2, 3, 66);
    });
  });

  describe('Authorization Scenarios', () => {
    it('should throw error when user is not authorized to view attempt', async () => {
      const attemptId = 'unauthorized-attempt-001';
      const userId = 'unauthorized-user-001';
      
      // This method should set up authorization to fail
      builder.givenUserIsNotAuthorized(attemptId, userId);
      const executor = await builder.whenQueryIsExecuted(attemptId, userId);
      
      // Since authorization is mocked to fail, we should get an error
      executor.thenShouldThrowCompletedAttemptNotFoundError();
    });
  });
});

// Test suite for the Object Mother integration
describe('SoloAttemptMother Integration', () => {
  it('should create valid aggregates for testing', () => {
    const perfectAttempt = SoloAttemptMother.createPerfectAttempt();
    expect(perfectAttempt).toBeDefined();
    expect(perfectAttempt.isCompleted()).toBe(true);
    expect(perfectAttempt.getNumberOfCorrectAnswers()).toBe(5);
    
    const inProgressAttempt = SoloAttemptMother.createInProgressAttempt();
    expect(inProgressAttempt).toBeDefined();
    expect(inProgressAttempt.isInProgress()).toBe(true);
    expect(inProgressAttempt.progress.questionsAnswered).toBe(3);
  });
});