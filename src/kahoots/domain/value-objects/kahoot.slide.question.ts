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