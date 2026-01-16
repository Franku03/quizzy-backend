import { ValueObject } from "src/core/domain/abstractions/value.object";
import { SubscriptionState } from "./user.subscription-state";
import { SubscriptionPlan } from "./user.subscription-plan";
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date";

interface UserSubscriptionStatusProps {
    readonly state: SubscriptionState;
    readonly plan: SubscriptionPlan;
    readonly expiresAt: DateISO;
}

export class UserSubscriptionStatus extends ValueObject<UserSubscriptionStatusProps> {

    constructor(state: SubscriptionState, plan: SubscriptionPlan, expiresAt: DateISO) {
        super({ state, plan, expiresAt });
    }

    get expiresAt(): DateISO {
        return this.properties.expiresAt;
    }

    get state(): SubscriptionState {
        return this.properties.state;
    }
    
    get plan(): SubscriptionPlan {
        return this.properties.plan;
    }

    public isActive(): boolean {
        return this.properties.state === SubscriptionState.ACTIVE;
    }

    public isPremium(): boolean {
        return this.properties.plan === SubscriptionPlan.MONTHLY_PREMIUM && 
               this.properties.state === SubscriptionState.ACTIVE;
    }

    public validateStatus(): UserSubscriptionStatus {
        if (this.properties.plan === SubscriptionPlan.FREE) {
            return this;
        }

        if (this.properties.state === SubscriptionState.INACTIVE) {
            return this;
        }

        const now = DateISO.generate();
        
        const hasExpired = !this.properties.expiresAt.isGreaterThan(now);

        if (hasExpired) {
            
            return new UserSubscriptionStatus(
                SubscriptionState.INACTIVE,
                this.properties.plan,
                this.properties.expiresAt
            );
        }

        return this;
    }

    public static createForPlan(plan: SubscriptionPlan): UserSubscriptionStatus {
        if (plan === SubscriptionPlan.FREE) {
            return new UserSubscriptionStatus(
                SubscriptionState.ACTIVE,
                SubscriptionPlan.FREE,
                DateISO.createFrom('2099-12-31')
            );
        }

        const now = new Date();
        const expiresDate = new Date(now);
        expiresDate.setDate(expiresDate.getDate() + 30);

        const expiresIsoString = expiresDate.toISOString().split('T')[0];

        return new UserSubscriptionStatus(
            SubscriptionState.ACTIVE,
            plan,
            DateISO.createFrom(expiresIsoString)
        );
    }
    
}