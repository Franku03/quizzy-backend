import { KahootAssignedToGroupEvent } from 'src/core/domain/domain-events/kahoot-assigned-to-group.event';
import { NotifyKahootAssignedUseCase } from '../use-cases/notify-kahoot-assigned.use-case';

export class KahootAssignedListener {
    constructor(
        private readonly notifyKahootAssignedUseCase: NotifyKahootAssignedUseCase
    ) { }

    public async on(event: KahootAssignedToGroupEvent): Promise<void> {
        await this.notifyKahootAssignedUseCase.execute({
            groupId: event.groupId.value,
            kahootId: event.kahootId.value,
            assignedBy: event.assignedBy.value,
            availableFrom: event.availableFrom,
            availableUntil: event.availableUntil,
        });
    }
}
