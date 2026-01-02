import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export enum TimeLimitSecondsEnum {
    FIVE_SECONDS = 5,
    TEN_SECONDS = 10,
    TWENTY_SECONDS = 20,
    THIRTY_SECONDS = 30,
    FOURTY_FIVE_SECONDS = 45,
    SIXTY_SECONDS = 60,
    NINETY_SECONDS = 90,
    HUNDRED_TWENTY_SECONDS = 120, 
    HUNDRED_EIGHTY_SECONDS = 180, 
    TWO_HUNDRED_FOURTY_SECONDS = 240,
}

interface TimeLimitProps {
    readonly value: number;
}

export class TimeLimitSeconds extends ValueObject<TimeLimitProps> {
    
    public constructor(seconds: number) {
        super({ value: seconds });
    }

    public static create(seconds: number): Either<ErrorData, TimeLimitSeconds> {
        const domainContext = createDomainContext('TimeLimitSeconds', 'ValueObject');

        if (!Number.isInteger(seconds) || seconds <= 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                domainContext,
                { value: ['MUST_BE_POSITIVE_INTEGER'] },
                "El límite de tiempo debe ser un número entero positivo."
            ));
        }

        if (!Object.values(TimeLimitSecondsEnum).includes(seconds)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                domainContext,
                { value: ['INVALID_TIME_LIMIT'] },
                `El valor de tiempo (${seconds}s) no es un valor permitido.`
            ));
        }

        return Either.makeRight(new TimeLimitSeconds(seconds));
    }
    
    public get value(): number { return this.properties.value; }
}