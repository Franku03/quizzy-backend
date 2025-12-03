// This command carries the necessary data to submit an answer in a single-player attempt.
// It acts as a DTO between the infrastructure (Controller) and the application layer.
export class SubmitAnswerCommand {
  constructor(
    public readonly attemptId: string,
    public readonly userId: string,
    public readonly slideId: string,
    public readonly answerIndex: number[],
    public readonly timeElapsedSeconds: number
  ) {}
}