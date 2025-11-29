import { ValueObject } from "src/core/domain/abstractions/value.object";
import { MAX_DESCRIPTION_LENGTH } from "../constants/kahoot.rules";

interface DescriptionProps {
    readonly description: string;
}

export class Description extends ValueObject<DescriptionProps> {
    
    public constructor(text: string) {
        
        const cleanText = text ? text.trim() : "";
        if (cleanText.length === 0) {
            throw new Error("La descripción no puede estar vacía.");
        }
        if (cleanText.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`La descripción no puede exceder los ${MAX_DESCRIPTION_LENGTH} caracteres.`);
        }
        super({ description: cleanText });
    }

    public get description(): string {
        return this.properties.description;
    }
}