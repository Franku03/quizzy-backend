import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";
import { UserSubscriptionStatus } from "../value-objects/user.user-subscription-status";

export class SubscriptionActivated {
    constructor(
        public readonly userId: UserId,
        public readonly subscriptionStatus: UserSubscriptionStatus,
        public readonly occurredOn: Date = new Date()
    ) {}
}