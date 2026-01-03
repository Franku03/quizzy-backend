// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export enum VisibilityStatusEnum {
    PRIVATE = "PRIVATE",
    PUBLIC = "PUBLIC"
}

interface VisibilityStatusProps {
    readonly value: VisibilityStatusEnum;
}

export class VisibilityStatus extends ValueObject<VisibilityStatusProps> {

    public constructor(status: VisibilityStatusEnum) {
        super({ value: status });
    }

    public static create(status: string): Either<ErrorData, VisibilityStatus> {
        // El VO solo conoce su propia identidad técnica
        const context = createDomainContext('VisibilityStatus', 'validateVisibility', {
            domainObjectKind: 'ValueObject'
        });

        if (!Object.values(VisibilityStatusEnum).includes(status as VisibilityStatusEnum)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { status: ['INVALID_VISIBILITY'] },
                `The visibility value '${status}' is not valid.`
            ));
        }

        return Either.makeRight(new VisibilityStatus(status as VisibilityStatusEnum));
    }
    
    public get value(): VisibilityStatusEnum { return this.properties.value; }
}