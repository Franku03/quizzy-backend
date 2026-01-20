// This command carries the necessary data to initiate a new single-player attempt.
// It acts as a DTO between the infrastructure (Controller) and the application layer.
import { ICommand } from 'src/core/application/cqrs/command.interface';

export class StartSoloAttemptCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly kahootId: string,
  ) {}
}