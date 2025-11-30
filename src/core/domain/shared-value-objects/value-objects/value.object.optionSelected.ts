
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { OptionSnapshot } from "../../snapshots/snapshot.option";

// Used by game engines to represent an answer selected by a player in a question
export class answerSelected extends ValueObject<OptionSnapshot>{
    private constructor(props: OptionSnapshot) {
        super(props);
    }

    // Factory Method (used by clients to pass direct parameters instead of props object)
      public static create(
        optionText: string | null, 
        isCorrect: boolean, 
        optionImageId: string | null
      ): answerSelected {
        return new answerSelected({
          optionText: optionText,
          isCorrect: isCorrect,
          optionImageId: optionImageId
        });
      } 
      
    // Getters
    public get optionText(): string | null{
        return this.properties.optionText;
    }

    public get isCorrect(): boolean {
        return this.properties.isCorrect;
    }

    public get optionImageId(): string | null {
        return this.properties.optionImageId;
    }
}