import { ValueObject } from "src/core/domain/value.object";
import { Optional } from "src/core/types/optional";
import { MAX_QUESTION_LENGTH } from "../constants/kahoot.slide.rules";

interface QuestionProps {
    readonly value: Optional<string>;
}

export class Question extends ValueObject<QuestionProps> {

    public constructor(optionalText: Optional<string>) {

        if (optionalText.hasValue()) {
            const currentText = optionalText.getValue().trim();
            
            if (currentText.length > MAX_QUESTION_LENGTH) {
                throw new Error(`La pregunta no puede exceder los ${MAX_QUESTION_LENGTH} caracteres.`);
            }
        }

        super({ value: optionalText });
    }
    
    public get value(): Optional<string> {return this.properties.value;}
    
}