import { KahootAssignedEvent } from 'src/core/domain/domain-events/kahoot-assigned.event';
import { NotifyKahootAssignedUseCase } from '../use-cases/notify-kahoot-assigned.use-case';

export class KahootAssignedListener {
    constructor(
        private readonly notifyKahootAssignedUseCase: NotifyKahootAssignedUseCase
    ) { }

    public async on(event: KahootAssignedEvent): Promise<void> {
        await this.notifyKahootAssignedUseCase.execute(event);
    }
}
