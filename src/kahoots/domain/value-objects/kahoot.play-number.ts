// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

interface PlayNumberProps {
    readonly count: number;
}

export class PlayNumber extends ValueObject<PlayNumberProps> {

    public static readonly ZERO = new PlayNumber(0);
    
    public constructor(count: number) {
        super({ count });
    }

    public static create(count: number): Either<ErrorData, PlayNumber> {
        const context = createDomainContext('PlayNumber', 'validatePlayNumber', {
            domainObjectKind: 'ValueObject'
        });

        if (!Number.isInteger(count)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { count: ['MUST_BE_INTEGER'] },
                "PlayNumber must be an integer."
            ));
        }

        if (count < 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { count: ['NEGATIVE_NOT_ALLOWED'] },
                "PlayNumber cannot be negative."
            ));
        }

        return Either.makeRight(new PlayNumber(count));
    }

    public increment(): PlayNumber {
        return new PlayNumber(this.properties.count + 1);
    }
    
    public get count(): number { return this.properties.count; }
}