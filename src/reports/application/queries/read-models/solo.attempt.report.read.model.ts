// src/solo-attempts/application/queries/read-models/attempt-detailed.read.model.ts

export class QuestionResultReadModel {
  constructor(
    public readonly questionIndex: number,
    public readonly questionText: string,
    public readonly isCorrect: boolean,
    public readonly answerText: string[],
    public readonly answerMediaId: string[],
    public readonly timeTakenMs: number,
  ) {}
}

export class AttemptReportReadModel {
  constructor(
    public readonly kahootId: string,
    public readonly title: string, // Requires joining with Kahoot Collection
    public readonly userId: string,
    public readonly finalScore: number,
    public readonly correctAnswers: number,
    public readonly totalQuestions: number,
    public readonly averageTimeMs: number,
    public readonly questionResults: QuestionResultReadModel[],
  ) {}
}