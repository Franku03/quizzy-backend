import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";
import { MAX_QUESTION_LENGTH } from "../constants/kahoot.slide.rules";

interface QuestionProps {
    readonly value: string;
}

export class Question extends ValueObject<QuestionProps> {

    public constructor(value: string) {

        if (value.length === 0) {
            throw new Error("El texto de la pregunta no puede estar vacío.");
        }

        if (value.length > MAX_QUESTION_LENGTH) {
            throw new Error(`La pregunta no puede exceder los ${MAX_QUESTION_LENGTH} caracteres.`);
        }

        super({ value });
    }
    
    public get value(): string {return this.properties.value;}
    
}