import { ValueObject } from "src/core/domain/abstractions/value.object";

interface AttemptProgressProps {
    totalQuestions: number;
    questionsAnswered: number;
}

export class AttemptProgress extends ValueObject<AttemptProgressProps> {
    
    private constructor(props: AttemptProgressProps) {
        super(props);
         if (props.totalQuestions < 0) {
            throw new Error("AttemptProgress validation failed: Total questions cannot be negative.");
        }

        if (props.questionsAnswered < 0) {
            throw new Error("AttemptProgress validation failed: Questions answered cannot be negative.");
        }

        if (props.questionsAnswered > props.totalQuestions) {
            throw new Error("AttemptProgress validation failed: Questions answered cannot exceed total questions.");
        }
    }

    // Factory method to create the VO, ensuring validation runs before creation
    public static create(totalQuestions: number, questionsAnswered: number): AttemptProgress {
        return new AttemptProgress({ totalQuestions, questionsAnswered });
    }

    public get totalQuestions(): number {
        return this.properties.totalQuestions;
    }

    public get questionsAnswered(): number {
        return this.properties.questionsAnswered;
    }

    // Calculates the percentage of the game completed
    public getProgressPercentage(): number {
        if (this.properties.totalQuestions === 0) {
            return 0;
        }
        // Returns a value between 0.0 and 100.0
        return (this.properties.questionsAnswered / this.properties.totalQuestions) * 100;
    }

    // Returns a NEW Value Object with the incremented count.
    // We never modify 'this.properties' directly as they are frozen by the base class.
    public addAnswer(): AttemptProgress {
        const newAnsweredCount = this.properties.questionsAnswered + 1;
        
        // Validation will happen automatically in the constructor of the new instance
        return new AttemptProgress({
            totalQuestions: this.properties.totalQuestions,
            questionsAnswered: newAnsweredCount
        });
    }
}