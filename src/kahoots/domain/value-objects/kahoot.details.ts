/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.details.ts

// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { Optional } from "src/core/types/optional";

// --- Domain Snapshots & Rules ---
import { KahootDetailsSnapshot } from "src/core/domain/snapshots/snapshot.kahoot.details";
import { MAX_DESCRIPTION_LENGTH, MAX_TITLE_LENGTH } from "../constants/kahoot.rules";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export enum KahootCategoryEnum {
    MATHEMATICS = 'Mathematics',
    SCIENCE = 'Science',
    BIOLOGY = 'Biology',
    CHEMISTRY = 'Chemistry',
    PHYSICS = 'Physics',
    LITERATURE = 'Literature',
    HISTORY = 'History',
    GEOGRAPHY = 'Geography',
    ART = 'Art',
    MUSIC = 'Music',
    TECHNOLOGY = 'Technology',
    SPORTS = 'Sports',
    LANGUAGES = 'Languages',
    COMPUTER_SCIENCE = 'Computer Science',
    SOCIAL_STUDIES = 'Social Studies',
    PHILOSOPHY = 'Philosophy',
    ECONOMICS = 'Economics',
    PSYCHOLOGY = 'Psychology',
    TRIVIA = 'Trivia',
    GENERAL_KNOWLEDGE = 'General Knowledge'
}

interface KahootDetailsProps {
    readonly title: Optional<string>;
    readonly description: Optional<string>;
    readonly category: Optional<KahootCategoryEnum>;
}

export class KahootDetails extends ValueObject<KahootDetailsProps> {

    private constructor(props: KahootDetailsProps) {
        super(props);
    }

    public static create(
        t?: string,
        d?: string,
        c?: string
    ): Either<ErrorData, KahootDetails> {

        const context = createDomainContext('KahootDetails', 'validateDetails', {
            domainObjectKind: 'ValueObject'
        });

        // 1. Validaciones base
        if (!t && !d && !c) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { generic: ['MISSING_DATA'] }, 'At least a title, description, or category must be provided.'
            ));
        }

        if (t && t.length > MAX_TITLE_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { title: ['TOO_LONG'] }, `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`
            ));
        }

        if (d && d.length > MAX_DESCRIPTION_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context, { description: ['TOO_LONG'] }, `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
            ));
        }

        // 2. Normalización y Validación de Categoría
        let validatedCategory: KahootCategoryEnum | undefined = undefined;

        if (c) {
            const cleanCategory = c.trim().toLowerCase();
            // Buscamos el valor real del enum que coincida (case-insensitive)
            const categoryMatch = Object.values(KahootCategoryEnum).find(
                (val) => val.toLowerCase() === cleanCategory
            );

            if (!categoryMatch) {
                return Either.makeLeft(DomainErrorFactory.validation(
                    context,
                    { category: ['INVALID_CATEGORY'] },
                    `The value '${c}' is not a valid Kahoot category.`
                ));
            }
            validatedCategory = categoryMatch;
        }

        return Either.makeRight(new KahootDetails({
            title: new Optional(t),
            description: new Optional(d),
            category: new Optional(validatedCategory)
        }));
    }

    public isValidDetails(): Either<ErrorData, boolean> {
        const context = createDomainContext('KahootDetails', 'checkPublicationReadiness', {
            domainObjectKind: 'ValueObject'
        });

        /*if (!this.properties.title.hasValue() || !this.properties.description.hasValue() || !this.properties.category.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { publication: ['INCOMPLETE_DETAILS'] },
                "Title, description, and category are required to publish the Kahoot."
            ));
        }*/
        if (!this.properties.title.hasValue() || !this.properties.category.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { publication: ['INCOMPLETE_DETAILS'] },
                "Title and category are required to publish the Kahoot."
            ));
        }
        return Either.makeRight(true);
    }

    public get title(): Optional<string> { return this.properties.title; }
    public get description(): Optional<string> { return this.properties.description; }
    public get category(): Optional<KahootCategoryEnum> { return this.properties.category; }

    public getSnapshot(): KahootDetailsSnapshot {
        return {
            title: this.properties.title.hasValue() ? this.properties.title.getValue() : undefined,
            description: this.properties.description.hasValue() ? this.properties.description.getValue() : undefined,
            category: this.properties.category.hasValue() ? this.properties.category.getValue() : undefined,
        };
    }
}