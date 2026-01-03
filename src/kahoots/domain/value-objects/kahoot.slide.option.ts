// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";

// --- Domain Models & Rules ---
import { ImageId } from "../../../core/domain/shared-value-objects/id-objects/image.id";
import { MAX_OPTION_TEXT_LENGTH } from "../constants/kahoot.slide.rules";
import { OptionSnapshot } from "src/core/domain/snapshots/snapshot.option"; 

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

interface OptionProps {
    readonly text: string;
    readonly isCorrect: boolean; 
    readonly optionImage: Optional<ImageId>;
}

export class Option extends ValueObject<OptionProps> {
    
    public constructor(text: string, isCorrect: boolean, optionImage: Optional<ImageId>) {
        super({ text, isCorrect, optionImage });
    }

    public static create(
        text: string, 
        isCorrect: boolean, 
        optionImage: Optional<ImageId>,
        optionTextMaxLength: number = MAX_OPTION_TEXT_LENGTH
    ): Either<ErrorData, Option> {
        // Contexto estandarizado: Identidad 'Option' y tipo 'ValueObject'
        const context = createDomainContext('Option', 'validateOption', {
            domainObjectKind: 'ValueObject'
        });
        
        const cleanText = text ? text.trim() : "";
        const imageIsPresent = optionImage.hasValue();

        // Regla: No se permite texto e imagen a la vez
        if (imageIsPresent && cleanText.length > 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { generic: ['EXCLUSIVE_CONTENT_REQUIRED'] },
                "An option cannot have both text and an image simultaneously."
            ));
        }

        // Regla: Debe tener al menos uno
        if (!imageIsPresent && cleanText.length === 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { generic: ['CONTENT_REQUIRED'] },
                "An option must have content (either text or image)."
            ));
        }

        // Regla: Límite de caracteres
        if (cleanText.length > optionTextMaxLength) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { text: ['TOO_LONG'] },
                `Option text cannot exceed ${optionTextMaxLength} characters.`
            ));
        }

        return Either.makeRight(new Option(cleanText, isCorrect, optionImage));
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