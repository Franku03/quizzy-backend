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
    
    public constructor(
        title: Optional<string>, 
        description: Optional<string>, 
        category: Optional<string>
    ) {
        super({ title, description, category });
    }

    public static create(
        title: Optional<string>, 
        description: Optional<string>, 
        category: Optional<string>
    ): Either<ErrorData, KahootDetails> {
        
        const context = createDomainContext('KahootDetails', 'validateDetails', {
            domainObjectKind: 'ValueObject'
        });

        if(!title.hasValue() && !description.hasValue() && !category.hasValue()) {
             return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { generic: ['MISSING_DATA'] },
                'At least a title, description, or category must be provided.'
             ));
        }

        if (title.hasValue() && title.getValue().length > MAX_TITLE_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { title: ['TOO_LONG'] },
                `Title cannot exceed ${MAX_TITLE_LENGTH} characters.`
            ));
        }

        if (description.hasValue() && description.getValue().length > MAX_DESCRIPTION_LENGTH) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { description: ['TOO_LONG'] },
                `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`
            ));
        }

        return Either.makeRight(new KahootDetails(title, description, category));
    }

    public isValidDetails(): Either<ErrorData, boolean> {
        const context = createDomainContext('KahootDetails', 'checkPublicationReadiness', {
            domainObjectKind: 'ValueObject'
        });

        if(!this.properties.title.hasValue() || !this.properties.description.hasValue()) {
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