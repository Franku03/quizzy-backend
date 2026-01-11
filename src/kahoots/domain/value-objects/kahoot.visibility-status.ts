/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\domain\value-objects\kahoot.visibility-status.ts

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

    private constructor(status: VisibilityStatusEnum) {
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
                { visibility_status: ['INVALID_VISIBILITY'] },
                `The visibility value '${status}' is not valid.`
            ));
        }

        return Either.makeRight(new VisibilityStatus(status as VisibilityStatusEnum));
    }
    
    public get value(): VisibilityStatusEnum { return this.properties.value; }
}