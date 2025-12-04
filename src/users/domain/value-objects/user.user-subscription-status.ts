import { ValueObject } from "src/core/domain/abstractions/value.object";
import { SubscriptionState } from "./user.subscription-state"; // Ajusta ruta
import { SubscriptionPlan } from "./user.subscription-plan"; // Ajusta ruta
import { DateISO } from "src/core/domain/shared-value-objects/value-objects/value.object.date"; // Asegúrate de esta ruta

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
        if (this.properties.state !== SubscriptionState.ACTIVE) return false;
        
        const now = DateISO.generate();
        
        return this.properties.expiresAt.isGreaterThan(now);
    }

    public isPremium(): boolean {
        return this.isActive() && this.properties.plan === SubscriptionPlan.MONTHLY_PREMIUM;
    }
}