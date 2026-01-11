import { DomainEvent } from 'src/core/domain/abstractions/domain-event';

export class KahootAssignedEvent extends DomainEvent {
    constructor(
        public readonly groupId: string,
        public readonly groupName: string,
        public readonly kahootId: string,
        public readonly kahootTitle: string,
        public readonly assignerName: string,
        public readonly memberIds: string[],
        occurredOn: Date = new Date()
    ) {
        super(KahootAssignedEvent.name, occurredOn);
    }
}
