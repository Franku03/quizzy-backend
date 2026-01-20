// src/solo-attempts/application/queries/read-models/attempt-summary.read.model.ts

export class AttemptSummaryReadModel {
  constructor(
    public readonly attemptId: string,
    public readonly finalScore: number,
    public readonly totalCorrect: number,
    public readonly totalQuestions: number,
    public readonly accuracyPercentage: number,
  ) {}
}