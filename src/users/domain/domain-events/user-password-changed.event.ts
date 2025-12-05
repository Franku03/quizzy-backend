import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserEmail } from "../value-objects/user.email";

export class UserPasswordChangedEvent extends DomainEvent {
    static readonly EVENT_NAME = 'user.password.changed';

    constructor(
        public readonly userId: UserId,
        public readonly email: UserEmail,
    ) {
        super(UserPasswordChangedEvent.EVENT_NAME);
    }
}