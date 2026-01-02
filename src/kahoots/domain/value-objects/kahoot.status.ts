// --- Externals & Core ---
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";

// --- Shared Errors & Context ---
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export enum KahootStatusEnum {
    DRAFT = "DRAFT",
    PUBLISH = "PUBLISH"
}

interface KahootStatusProps {
    readonly value: KahootStatusEnum;
}

export class KahootStatus extends ValueObject<KahootStatusProps> {
    
    public constructor(status: KahootStatusEnum) {
        super({ value: status });
    }

    public static create(status: string): Either<ErrorData, KahootStatus> {
    const context = createDomainContext('KahootStatus', 'validateStatus', { 
        domainObjectKind: 'ValueObject' 
    });

    if (!Object.values(KahootStatusEnum).includes(status as KahootStatusEnum)) {
        return Either.makeLeft(DomainErrorFactory.validation(
            context,
            { status: ['INVALID_STATUS'] },
            `The value '${status}' is not valid for KahootStatus.`
        ));
    }
    return Either.makeRight(new KahootStatus(status as KahootStatusEnum));
}
    
    public get value(): KahootStatusEnum { return this.properties.value; }
}