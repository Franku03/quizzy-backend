import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { Optional } from "src/core/types/optional";
import { MAX_OPTION_TEXT_LENGTH } from "../constants/kahoot.slide.rules";


interface OptionProps {
    readonly text: string;
    readonly isCorrect: boolean; 
    readonly optionImage: Optional<ImageId>;
}

export class Option extends ValueObject<OptionProps> {
    
    public constructor(
        text: string, 
        isCorrect: boolean, 
        optionImage: Optional<ImageId>
    ) {
        
        const cleanText = text ? text.trim() : "";
        const imageIsPresent = optionImage.hasValue();

        if (imageIsPresent && cleanText.length > 0) {
            throw new Error("Una opción no puede tener texto y una imagen simultáneamente.");
        }
        if (!imageIsPresent && cleanText.length === 0) {
            throw new Error("Una opción debe tener contenido (texto o imagen).");
        }
        if (cleanText.length > MAX_OPTION_TEXT_LENGTH) {
            throw new Error(`El texto de la opción no puede superar los ${MAX_OPTION_TEXT_LENGTH} caracteres.`);
        }
        super({ text: cleanText, isCorrect, optionImage });
    }
    
    public getText(): string { return this.properties.text; }
    public isCorrectAnswer(): boolean { return this.properties.isCorrect; }
    public getImage(): Optional<ImageId> { return this.properties.optionImage; }
}