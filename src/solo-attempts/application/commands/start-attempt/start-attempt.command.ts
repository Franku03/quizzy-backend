// This command carries the necessary data to initiate a new single-player attempt.
// It acts as a DTO between the infrastructure (Controller) and the application layer.
export class StartSoloAttemptCommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}