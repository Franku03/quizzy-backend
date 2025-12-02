import { ValueObject } from "src/core/domain/abstractions/value.object";
import { SubscriptionState } from "../value-objects/user.subscription-state";
import { SubscriptionPlan } from "../value-objects/user.subscription-plan";

interface UserSubscriptionStatusProps {
    readonly state: SubscriptionState;
    readonly plan: SubscriptionPlan;
    readonly expiresAt: Date;
}

export class UserSubscriptionStatus extends ValueObject<UserSubscriptionStatusProps> {

    constructor(state: SubscriptionState, plan: SubscriptionPlan, expiresAt: Date) {
        UserSubscriptionStatus.ensureDateIsValid(expiresAt);
        super({ state, plan, expiresAt });
    }
    
    get state(): SubscriptionState {
        return this.properties.state;
    }

    get plan(): SubscriptionPlan {
        return this.properties.plan;
    }

    get expiresAt(): Date {
        return this.properties.expiresAt;
    }

    public isActive(): boolean {
        if (this.properties.state !== SubscriptionState.ACTIVE) return false;
        
        const now = new Date();
        return this.properties.expiresAt.getTime() > now.getTime();
    }

    public isPremium(): boolean {
        return this.isActive() && this.properties.plan === SubscriptionPlan.MONTHLY_PREMIUM;
    }

    private static ensureDateIsValid(date: Date): void {
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            throw new Error("La fecha de expiración de la suscripción no es válida.");
        }
    }
}