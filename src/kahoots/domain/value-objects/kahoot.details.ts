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

interface KahootDetailsProps {
    readonly title: Optional<string>;
    readonly description: Optional<string>;
    readonly category: Optional<string>;
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

        // 1. Validaciones usando tipos nativos (más limpio y rápido)
        if (!t && !d && !c) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { generic: ['MISSING_DATA'] },
                'At least a title, description, or category must be provided.'
            ));
        }

        if (t && t.length > MAX_TITLE_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { title: ['TOO_LONG'] },
                `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`
            ));
        }

        if (d && d.length > MAX_DESCRIPTION_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { description: ['TOO_LONG'] },
                `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
            ));
        }

        // 2. Creamos la instancia. 
        // Si tu clase base ValueObject requiere Optional, los envolvemos aquí:
        return Either.makeRight(new KahootDetails({
            title: new Optional(t),
            description: new Optional(d),
            category: new Optional(c)
        }));
    }

    public isValidDetails(): Either<ErrorData, boolean> {
        const context = createDomainContext('KahootDetails', 'checkPublicationReadiness', {
            domainObjectKind: 'ValueObject'
        });

        if (!this.properties.title.hasValue() || !this.properties.description.hasValue()) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { publication: ['INCOMPLETE_DETAILS'] },
                "A title and description are required to publish the Kahoot."
            ));
        }
        return Either.makeRight(true);
    }

    public get title(): Optional<string> { return this.properties.title; }
    public get description(): Optional<string> { return this.properties.description; }
    public get category(): Optional<string> { return this.properties.category; }

    public getSnapshot(): KahootDetailsSnapshot {
        return {
            title: this.properties.title.hasValue() ? this.properties.title.getValue() : undefined,
            description: this.properties.description.hasValue() ? this.properties.description.getValue() : undefined,
            category: this.properties.category.hasValue() ? this.properties.category.getValue() : undefined,
        };
    }
}