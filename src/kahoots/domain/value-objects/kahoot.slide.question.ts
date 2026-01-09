/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.slide.question.ts

// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";

// --- Domain Models & Rules ---
import { MAX_QUESTION_LENGTH } from "../constants/kahoot.slide.rules";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

interface QuestionProps {
    readonly value: string;
}

export class Question extends ValueObject<QuestionProps> {

    public constructor(value: string) {
        super({ value });
    }

    public static create(value: string): Either<ErrorData, Question> {
        // Ajustamos el contexto al estándar legal (Nombre, Operación, Kind)
        const context = createDomainContext('Question', 'validateQuestion', {
            domainObjectKind: 'ValueObject'
        });

        if (!value || value.trim().length === 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { value: ['EMPTY_QUESTION'] },
                "Question text cannot be empty."
            ));
        }

        if (value.length > MAX_QUESTION_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { value: ['TOO_LONG'] },
                `Question text cannot exceed ${MAX_QUESTION_LENGTH} characters.`
            ));
        }

        return Either.makeRight(new Question(value));
    }
    
    public get value(): string { return this.properties.value; }
}