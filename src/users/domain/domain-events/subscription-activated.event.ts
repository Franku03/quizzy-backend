import { DomainEvent } from "src/core/domain/abstractions/domain-event";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserSubscriptionStatus } from "../value-objects/user.user-subscription-status";

export class SubscriptionActivatedEvent extends DomainEvent {
    
    static readonly EVENT_NAME = 'user.subscription.activated';

    constructor(
        public readonly userId: UserId,
        public readonly subscriptionStatus: UserSubscriptionStatus,
    ) {
        
        super(SubscriptionActivatedEvent.EVENT_NAME);
    }
}