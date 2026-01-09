/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.slide.option.ts

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
        return OptionSnapshot.fromRaw({
            optionText: this.text || undefined,
            isCorrect: this.isCorrect,
            optionImageId: this.optionImage.hasValue() 
                ? this.optionImage.getValue().value 
                : undefined,
        });
    }
}