import { ValueObject } from "src/core/domain/abstractions/value.object";
import { AttemptStatusEnum } from "src/solo-attempts/domain/value-objects/attempt.status.enum";

interface AttemptStatusProps {
    status: AttemptStatusEnum;
}

export class AttemptStatus extends ValueObject<AttemptStatusProps> {
    
    public constructor(props: AttemptStatusProps) {
        super(props);
        // No additional validation needed for enum values
    }

    // Check if the attempt is completed
    public isCompleted(): boolean {
        return this.properties.status === AttemptStatusEnum.COMPLETED;
    }

    // Check if the attempt is currently in progress
    public isInProgress(): boolean {
        return this.properties.status === AttemptStatusEnum.IN_PROGRESS;
    }

    // Complete the attempt, returning a NEW Value Object with COMPLETED status
    public completeAttempt(): AttemptStatus {
        return new AttemptStatus({ status: AttemptStatusEnum.COMPLETED });
    }
    
    // Static factory method to create a brand new IN_PROGRESS status
    public static createInProgress(): AttemptStatus {
        return new AttemptStatus({ status: AttemptStatusEnum.IN_PROGRESS });
    }

    // STATIC factory method to create a COMPLETED status (Useful for rehydration)
    public static createCompleted(): AttemptStatus { 
        return new AttemptStatus({ status: AttemptStatusEnum.COMPLETED });
    }

    // Getter for the direct status enum
    public getEnum(): AttemptStatusEnum {
        return this.properties.status;
    }
}