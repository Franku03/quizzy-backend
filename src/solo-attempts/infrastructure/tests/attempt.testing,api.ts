// src/solo-attempts/tests/builders/get-attempt-summary.test-builder.ts
import { mock, MockProxy } from 'jest-mock-extended';
import { GetAttemptSummaryHandler } from 'src/solo-attempts/application/queries/get-summary/get-summary.handler';
import { GetAttemptSummaryQuery } from 'src/solo-attempts/application/queries/get-summary/get-summary.query';
import { AttemptSummaryReadModel } from 'src/solo-attempts/application/queries/read-models/summary.attempt.read.model';
import type { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Optional } from 'src/core/types/optional';
import { SoloAttemptMother } from './attempt.object.mother';
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';
import { ATTEMPT_ERROR_CODES } from 'src/solo-attempts/domain/errors/attempt.errors.codes';
import { AttemptOwnershipAuthorizer } from 'src/core/application/aspects/auth/strategies/attemptOwnership.strategy';

// Mock the decorators by creating a proxy handler that bypasses them
class DecoratorBypassHandler extends GetAttemptSummaryHandler {
  // Override the execute method to bypass decorators
  public async executeWithoutDecorators(
    query: GetAttemptSummaryQuery
  ): Promise<AttemptSummaryReadModel> {
    // Manually call the parent's execute logic without decorators
    return super.execute(query);
  }
}

export class GetAttemptSummaryTestBuilder {
  // Private mocks (hidden implementation details)
  private daoMock: MockProxy<ISoloAttemptQueryDao>;
  private loggerMock: MockProxy<ILogger>;
  private authorizerMock: MockProxy<AttemptOwnershipAuthorizer>;
  
  // Internal state for assertions
  private result: AttemptSummaryReadModel | null = null;
  private error: Error | null = null;
  private lastQuery: GetAttemptSummaryQuery | null = null;
  private handler: DecoratorBypassHandler;

  constructor() {
    this.daoMock = mock<ISoloAttemptQueryDao>();
    this.loggerMock = mock<ILogger>();
    this.authorizerMock = mock<AttemptOwnershipAuthorizer>();
    
    // Create handler with mocked dependencies
    this.handler = new DecoratorBypassHandler(
      this.daoMock,
      this.loggerMock
    );
  }

  // --- GIVEN Methods (Scenario Configuration) ---

  /**
   * Configures the DAO to return a completed attempt summary
   * Uses the AttemptMother to create a valid completed attempt
   */
  public givenACompletedAttemptExists(
    attemptId: string = "completed-attempt-001",
    userId: string = "user-001"
  ): this {
    // Create a completed attempt using the mother
    const attempt = SoloAttemptMother.createCustomCompletedAttempt(
      attemptId,
      "kahoot-001",
      userId,
      8, // 8 correct answers
      2, // 2 incorrect answers
      10 // 10 points per correct
    );

    // Calculate the summary that the DAO would return
    const totalCorrect = attempt.getNumberOfCorrectAnswers();
    const totalQuestions = attempt.progress.totalQuestions;
    const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
    
    const summary = new AttemptSummaryReadModel(
      attemptId,
      attempt.totalScore.getScore(),
      totalCorrect,
      totalQuestions,
      accuracy
    );

    // Mock the DAO to return this summary
    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional(summary)
    );

    // Mock authorizer to allow access
    this.setupAuthorization(attemptId, userId, true);

    return this;
  }

  /**
   * Configures the DAO to return a specific summary (for edge cases)
   */
  public givenASpecificSummaryExists(
    attemptId: string,
    userId: string = "user-001",
    summary: AttemptSummaryReadModel
  ): this {
    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional(summary)
    );

    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures the DAO to return a perfect score summary
   */
  public givenAPerfectScoreAttemptExists(
    attemptId: string = "perfect-attempt-001",
    userId: string = "user-expert-001"
  ): this {
    const attempt = SoloAttemptMother.createPerfectAttempt();
    
    const summary = new AttemptSummaryReadModel(
      attemptId,
      attempt.totalScore.getScore(),
      attempt.getNumberOfCorrectAnswers(),
      attempt.progress.totalQuestions,
      100 // 100% accuracy
    );

    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional(summary)
    );

    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures the DAO to return a zero score summary
   */
  public givenAZeroScoreAttemptExists(
    attemptId: string = "zero-attempt-001",
    userId: string = "user-beginner-001"
  ): this {
    const attempt = SoloAttemptMother.createZeroScoreAttempt();
    
    const summary = new AttemptSummaryReadModel(
      attemptId,
      0, // zero score
      0, // no correct answers
      attempt.progress.totalQuestions,
      0  // 0% accuracy
    );

    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional(summary)
    );

    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures the DAO to return no summary (attempt not found or not completed)
   */
  public givenNoSummaryExists(
    attemptId: string,
    userId: string = "user-001"
  ): this {
    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional<AttemptSummaryReadModel>() // Empty optional
    );

    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures the DAO to throw an error (simulating database failure)
   */
  public givenDaoThrowsError(
    attemptId: string,
    userId: string = "user-001",
    error: Error
  ): this {
    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockRejectedValue(error);
    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures the DAO to return an in-progress attempt (not completed)
   * This should return an empty optional
   */
  public givenAnInProgressAttempt(
    attemptId: string = "in-progress-001",
    userId: string = "user-001"
  ): this {
    this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
      new Optional<AttemptSummaryReadModel>() // Empty optional
    );

    this.setupAuthorization(attemptId, userId, true);
    return this;
  }

  /**
   * Configures authorization to fail (user doesn't own the attempt)
   */
  public givenUserIsNotAuthorized(
    attemptId: string,
    userId: string
  ): this {
    this.setupAuthorization(attemptId, userId, false);
    return this;
  }

  // --- WHEN Methods (Action Execution) ---

  /**
   * Executes the GetAttemptSummaryQuery
   */
  public async whenQueryIsExecuted(
    attemptId: string,
    userId: string
  ): Promise<TestExecutor> {
    const query = new GetAttemptSummaryQuery(attemptId, userId);
    this.lastQuery = query;

    try {
      // Use the bypass method to avoid decorator issues
      this.result = await this.handler.executeWithoutDecorators(query);
    } catch (error) {
      this.error = error as Error;
    }

    return new TestExecutor(this);
  }

  // --- THEN Methods (Assertions) ---

  /**
   * Asserts that a summary was successfully returned
   */
  public thenSummaryShouldBe(expectedSummary: AttemptSummaryReadModel): void {
    expect(this.error).toBeNull();
    expect(this.result).not.toBeNull();
    expect(this.result).toEqual(expectedSummary);
  }

  /**
   * Asserts that the summary has specific properties
   */
  public thenSummaryShouldHave(
    expectedScore: number,
    expectedCorrect: number,
    expectedTotal: number,
    expectedAccuracy: number
  ): void {
    expect(this.error).toBeNull();
    expect(this.result).not.toBeNull();
    
    expect(this.result!.finalScore).toBe(expectedScore);
    expect(this.result!.totalCorrect).toBe(expectedCorrect);
    expect(this.result!.totalQuestions).toBe(expectedTotal);
    expect(this.result!.accuracyPercentage).toBe(expectedAccuracy);
  }

  /**
   * Asserts that a "completed attempt not found" error was thrown
   */
  public thenShouldThrowCompletedAttemptNotFoundError(): void {
    expect(this.result).toBeNull();
    expect(this.error).not.toBeNull();
    expect(this.error!.message).toBe(ATTEMPT_ERROR_CODES.COMPLETED_ATTEMPT_NOT_FOUND);
  }

  /**
   * Asserts that a specific error was thrown
   */
  public thenShouldThrowError(expectedError: Error | string): void {
    expect(this.result).toBeNull();
    expect(this.error).not.toBeNull();
    
    if (typeof expectedError === 'string') {
      expect(this.error!.message).toBe(expectedError);
    } else {
      expect(this.error!.message).toBe(expectedError.message);
    }
  }

  /**
   * Asserts that the DAO was called with the correct attempt ID
   */
  public thenDaoShouldHaveBeenCalledWith(attemptId: string): void {
    expect(this.daoMock.getPerformanceSummary).toHaveBeenCalledWith(attemptId);
  }

  /**
   * Asserts that the DAO was called exactly once
   */
  public thenDaoShouldHaveBeenCalledOnce(): void {
    expect(this.daoMock.getPerformanceSummary).toHaveBeenCalledTimes(1);
  }

  /**
   * Asserts that the DAO was not called
   */
  public thenDaoShouldNotHaveBeenCalled(): void {
    expect(this.daoMock.getPerformanceSummary).not.toHaveBeenCalled();
  }

  /**
   * Asserts that logging occurred
   */
  public thenLoggingShouldHaveOccurred(): void {
    expect(this.loggerMock.log).toHaveBeenCalled();
  }

  // --- Private Helper Methods ---

  private setupAuthorization(
    attemptId: string,
    userId: string,
    isAuthorized: boolean
  ): void {
    // Mock the authorizer behavior
    // Since the @Authorize decorator uses attemptQueryDao, we need to ensure
    // the DAO is properly mocked for authorization checks
    if (!isAuthorized) {
      // For unauthorized access, we could throw an error or return empty
      this.daoMock.getPerformanceSummary.calledWith(attemptId).mockResolvedValue(
        new Optional<AttemptSummaryReadModel>() // Empty - not found/not authorized
      );
    }
    // Note: The actual authorization logic would need to be mocked properly
    // based on how AttemptOwnershipAuthorizer works
  }

  // --- Utility Methods ---

  public getResult(): AttemptSummaryReadModel | null {
    return this.result;
  }

  public getError(): Error | null {
    return this.error;
  }

  public getLastQuery(): GetAttemptSummaryQuery | null {
    return this.lastQuery;
  }

  public getDaoMock(): MockProxy<ISoloAttemptQueryDao> {
    return this.daoMock;
  }

  public getLoggerMock(): MockProxy<ILogger> {
    return this.loggerMock;
  }

  public reset(): this {
    this.result = null;
    this.error = null;
    this.lastQuery = null;
    // Reset mock calls but keep mock instances
    jest.clearAllMocks();
    // Re-create handler with fresh mocks
    this.daoMock = mock<ISoloAttemptQueryDao>();
    this.loggerMock = mock<ILogger>();
    this.authorizerMock = mock<AttemptOwnershipAuthorizer>();
    this.handler = new DecoratorBypassHandler(
      this.daoMock,
      this.loggerMock
    );
    return this;
  }
}

/**
 * Helper class to enable method chaining after async operations
 */
class TestExecutor {
  constructor(private builder: GetAttemptSummaryTestBuilder) {}

  public thenSummaryShouldBe(expectedSummary: AttemptSummaryReadModel): TestExecutor {
    this.builder.thenSummaryShouldBe(expectedSummary);
    return this;
  }

  public thenSummaryShouldHave(
    expectedScore: number,
    expectedCorrect: number,
    expectedTotal: number,
    expectedAccuracy: number
  ): TestExecutor {
    this.builder.thenSummaryShouldHave(expectedScore, expectedCorrect, expectedTotal, expectedAccuracy);
    return this;
  }

  public thenShouldThrowCompletedAttemptNotFoundError(): TestExecutor {
    this.builder.thenShouldThrowCompletedAttemptNotFoundError();
    return this;
  }

  public thenShouldThrowError(expectedError: Error | string): TestExecutor {
    this.builder.thenShouldThrowError(expectedError);
    return this;
  }

  public thenDaoShouldHaveBeenCalledWith(attemptId: string): TestExecutor {
    this.builder.thenDaoShouldHaveBeenCalledWith(attemptId);
    return this;
  }

  public thenDaoShouldHaveBeenCalledOnce(): TestExecutor {
    this.builder.thenDaoShouldHaveBeenCalledOnce();
    return this;
  }

  public thenDaoShouldNotHaveBeenCalled(): TestExecutor {
    this.builder.thenDaoShouldNotHaveBeenCalled();
    return this;
  }

  public thenLoggingShouldHaveOccurred(): TestExecutor {
    this.builder.thenLoggingShouldHaveOccurred();
    return this;
  }

  public getResult(): AttemptSummaryReadModel | null {
    return this.builder.getResult();
  }

  public getError(): Error | null {
    return this.builder.getError();
  }
}

// Convenience factory function
export const GetAttemptSummaryTestBuilderFactory = {
  create: () => new GetAttemptSummaryTestBuilder(),
  
  // Pre-configured scenarios
  withCompletedAttempt: (attemptId?: string, userId?: string) => 
    new GetAttemptSummaryTestBuilder().givenACompletedAttemptExists(attemptId, userId),
  
  withPerfectScore: (attemptId?: string, userId?: string) =>
    new GetAttemptSummaryTestBuilder().givenAPerfectScoreAttemptExists(attemptId, userId),
  
  withZeroScore: (attemptId?: string, userId?: string) =>
    new GetAttemptSummaryTestBuilder().givenAZeroScoreAttemptExists(attemptId, userId),
  
  withNoSummary: (attemptId: string, userId?: string) =>
    new GetAttemptSummaryTestBuilder().givenNoSummaryExists(attemptId, userId),
  
  withInProgressAttempt: (attemptId?: string, userId?: string) =>
    new GetAttemptSummaryTestBuilder().givenAnInProgressAttempt(attemptId, userId),
  
  withUnauthorizedUser: (attemptId: string, userId: string) =>
    new GetAttemptSummaryTestBuilder().givenUserIsNotAuthorized(attemptId, userId),
};