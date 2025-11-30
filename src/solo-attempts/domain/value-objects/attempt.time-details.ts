import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";

interface AttemptTimeDetailsProps {
    startedAt: Date;
    lastPlayedAt: Date;
    completedAt: Optional<Date>;
}

export class AttemptTimeDetails extends ValueObject<AttemptTimeDetailsProps> {

    private constructor(props: AttemptTimeDetailsProps) {
        super(props);
        
        // 1. Basic Existence Checks
        if (!props.startedAt) {
            throw new Error("startedAt is required.");
        }
        if (!props.lastPlayedAt) {
            throw new Error("lastPlayedAt is required.");
        }

        // 2. Temporal Logic: Last played cannot be before start
        if (props.lastPlayedAt < props.startedAt) {
            throw new Error("lastPlayedAt cannot be before startedAt.");
        }

        // 3. Completion Logic using Optional Monad
        if (props.completedAt.hasValue()) {
            const completionDate = props.completedAt.getValue();
            
            if (completionDate < props.startedAt) {
                throw new Error("completedAt cannot be before startedAt.");
            }
        }
    }

    // Factory method for a brand new attempt
    public static create(startedAt: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: startedAt,
            lastPlayedAt: startedAt, // When created, the last interaction is the start itself
            completedAt: new Optional<Date>() // Initialize as empty Optional
        });
    }

    public get startedAt(): Date {
        return this.properties.startedAt;
    }

    public get lastPlayedAt(): Date {
        return this.properties.lastPlayedAt;
    }

    public get completedAt(): Optional<Date> {
        return this.properties.completedAt;
    }

    // "A player can leave... next time they play it they will have the option to continue it"
    public continue(interactionDate: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: this.properties.startedAt,
            lastPlayedAt: interactionDate,
            completedAt: this.properties.completedAt // Preserve existing optional state
        });
    }

    // "When a player finishes a kahoot..."
    public complete(completionDate: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: this.properties.startedAt,
            lastPlayedAt: completionDate,
            completedAt: new Optional<Date>(completionDate) // Wrap date in Optional
        });
    }
}