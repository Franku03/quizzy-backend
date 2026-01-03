// src/core/domain/abstractions/vo.id.ts
import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "./value.object";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

const UUID_V4_REGEX = /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

export abstract class UuidVO extends ValueObject<{ value: string }> {
    protected constructor(id: string) {
        super({ value: id });
    }

    protected static check(id: string, name: string): Either<ErrorData, string> {
        const context = createDomainContext(name, 'validateFormat', {
            domainObjectKind: 'ValueObject'
        });

        if (!id || !UUID_V4_REGEX.test(id)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                context,
                { id: ['INVALID_FORMAT'] },
                `The format for ${name} is invalid.`
            ));
        }
        return Either.makeRight(id);
    }

    public get value(): string { return this.properties.value; }
}