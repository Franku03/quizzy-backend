import { DomainEvent } from "../abstractions/domain-event";

export class MemberRemovedEvent extends DomainEvent {
    constructor(public readonly userId: string, public readonly groupId: string, public readonly removedBy: string) {
        super(MemberRemovedEvent.name);
    }
}