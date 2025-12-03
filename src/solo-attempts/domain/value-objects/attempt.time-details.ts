import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";

interface AttemptTimeDetailsProps {
    startedAt: Date;
    lastPlayedAt: Date;
    completedAt: Optional<Date>;
}

export class AttemptTimeDetails extends ValueObject<AttemptTimeDetailsProps> {

    public constructor(props: AttemptTimeDetailsProps) {
        super(props);

        // Format Validation

        // Validate ISO 8601 format for all dates
        this.validateISO8601(props.startedAt, "StartedAt");
        this.validateISO8601(props.lastPlayedAt, "LastPlayedAt");
        if (props.completedAt.hasValue()) {
            this.validateISO8601(props.completedAt.getValue(), "CompletedAt");
        }

        // Temporal Logic - The order of dates must make sense

        // Last Played Date cannot be before Started Date
        if (props.lastPlayedAt < props.startedAt) {
            throw new Error("Date at which the attempt was last played cannot come before the date at which it was started.");
        }

        // If CompletedAt is provided, it must be after StartedAt ( a completion can't happen before the start )
        // It also must be after LastPlayedAt ( a completion can't happen before the last interaction )
        // We check if it has value first since it's optional
        if (props.completedAt.hasValue()) {
            const completionDate = props.completedAt.getValue();
            
            if (completionDate < props.startedAt) {
                throw new Error("Date at which the attempt was completed cannot come before the date at which it was started.");
            }
            else if (completionDate < props.lastPlayedAt) {
                throw new Error("Date at which the attempt was completed cannot come before the date at which it was last played.");
            }
        }

        // None of the dates can be in the future compared to now.
        // (Server and client times should be in sync)
        
        const now = new Date();
        if (props.startedAt > now) {
            throw new Error("Date at which the attempt was started cannot be in the future.");
        }
        if (props.lastPlayedAt > now) {
            throw new Error("Date at which the attempt was last played cannot be in the future.");
        }
        if (props.completedAt.hasValue() && props.completedAt.getValue() > now) {
            throw new Error("Date at which the attempt was completed cannot be in the future.");
        }
    }

    // Validate ISO 8601 format for all dates
    public validateISO8601(date: Date, fieldName: string): void {
        // Convert date to ISO string and back to ensure it's valid
        const isoString = date.toISOString();
        const parsedDate = new Date(isoString);
        
        // Check if the date is valid and if it matches ISO format
        if (isNaN(date.getTime())) {
            throw new Error(`${fieldName} must be a valid date.`);
        }
        
        // Additional ISO 8601 format validation
        if (!this.isValidISO8601(date)) {
            throw new Error(`${fieldName} must be in ISO 8601 format.`);
        }
    };

    private isValidISO8601(date: Date): boolean {
        try {
            // Convert to ISO string and parse back
            const isoString = date.toISOString();
            
            // Validate ISO 8601 format using regex
            const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
            
            // Also check if the parsed date is valid
            const parsedDate = new Date(isoString);
            
            return isoRegex.test(isoString) && 
                   !isNaN(parsedDate.getTime()) &&
                   parsedDate.getTime() === date.getTime();
        } catch {
            return false;
        }
    }


    // Factory methods

    // Used by the aggregate when creating a brand new attempt 
    // Only the startedAt date is needed (lastPlayedAt is the same as startedAt at creation)
    public static create(startedAt: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: startedAt,
            lastPlayedAt: startedAt, // When created, the last interaction is the start itself
            completedAt: new Optional<Date>() // Initializes as empty Optional (not completed yet)
            // Once the attempt is completed, we will register it with completedAt() method
        });
    }

    // A player can leave a game and come back later... 
    // When they do, we update the last played date.
    public continueAt(interactionDate: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: this.properties.startedAt,
            lastPlayedAt: interactionDate,
            completedAt: this.properties.completedAt // Preserve existing optional state
        });
    }

    // When a player finishes a kahoot we update the completed date.
    public complete(completionDate: Date): AttemptTimeDetails {
        return new AttemptTimeDetails({
            startedAt: this.properties.startedAt,
            lastPlayedAt: this.properties.lastPlayedAt,
            completedAt: new Optional<Date>(completionDate) // Wrap date in Optional
        });
    }

    public isCompleted(): boolean {
        return this.properties.completedAt.hasValue();
    }

    // Getters

    public get startedAt(): Date {
        return this.properties.startedAt;
    }

    public get lastPlayedAt(): Date {
        return this.properties.lastPlayedAt;
    }

    public get completedAt(): Optional<Date> {
        return this.properties.completedAt;
    }

}