import { DomainEvent } from "../abstractions/domain-event";

export class GroupCreatedEvent extends DomainEvent {
    constructor(public readonly groupId: string, public readonly createdBy: string) {
        super(GroupCreatedEvent.name);
    }
}