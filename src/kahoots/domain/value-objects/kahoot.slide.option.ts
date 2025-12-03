import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { Optional } from "src/core/types/optional";
import { MAX_OPTION_TEXT_LENGTH } from "../constants/kahoot.slide.rules";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option"; 


interface OptionProps {
    readonly text: string;
    readonly isCorrect: boolean; 
    readonly optionImage: Optional<ImageId>;
}

export class Option extends ValueObject<OptionProps> {
    
    public constructor(
        text: string, 
        isCorrect: boolean, 
        optionImage: Optional<ImageId>,
        optionTextMaxLength: number = MAX_OPTION_TEXT_LENGTH
    ) {
        
        const cleanText = text ? text.trim() : "";
        const imageIsPresent = optionImage.hasValue();

        if (imageIsPresent && cleanText.length > 0) {
            throw new Error("Una opción no puede tener texto y una imagen simultáneamente.");
        }
        if (!imageIsPresent && cleanText.length === 0) {
            throw new Error("Una opción debe tener contenido (texto o imagen).");
        }
        if (cleanText.length > optionTextMaxLength) {
            throw new Error(`El texto de la opción no puede superar los ${optionTextMaxLength} caracteres.`);
        }
        super({ text: cleanText, isCorrect, optionImage });
    }
    
    public get text(): string { return this.properties.text; }
    public get isCorrect(): boolean { return this.properties.isCorrect; }
    public get optionImage(): Optional<ImageId> { return this.properties.optionImage; }

    public hasText(): boolean {
        return this.text.length > 0;
    }

    public hasImage(): boolean {
        return this.properties.optionImage.hasValue();
    }
    
    public isWithinLengthLimit(maxLength: number): boolean {
        return this.text.length <= maxLength;
    }

    public getSnapshot(): OptionSnapshot {
    return {
        optionText: this.properties.text ? this.properties.text : undefined,
        isCorrect: this.properties.isCorrect,
        optionImageId: this.properties.optionImage.hasValue() 
            ? this.properties.optionImage.getValue().value
            : undefined,
    };
}
}