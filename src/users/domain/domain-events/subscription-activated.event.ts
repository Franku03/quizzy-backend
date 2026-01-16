/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\domain-events\subscription-activated.event.ts

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