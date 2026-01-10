/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.status.ts

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