import { Either, ErrorData } from "src/core/types";
import { ValueObject } from "src/core/domain/abstractions/value.object";
import { DomainErrorFactory } from "src/core/errors/factories/domain-error.factory";
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

export enum PointsEnum {
    CERO_POINTS = 0,
    FIVE_HUNDRED_POINTS = 500,
    THOUSAND_POINTS = 1000,
    TWO_THOUSAND_POINTS = 2000,
}

interface PointsProps {
    readonly value: number;
}

export class Points extends ValueObject<PointsProps> {
    
    public constructor(points: number) {
        super({ value: points });
    }

    public static create(points: number): Either<ErrorData, Points> {
        const domainContext = createDomainContext('Points', 'ValueObject');

        if (!Number.isInteger(points) || points < 0) {
            return Either.makeLeft(DomainErrorFactory.validation(
                domainContext,
                { value: ['MUST_BE_NON_NEGATIVE_INTEGER'] },
                "Los puntos deben ser un número entero positivo o cero."
            ));
        }

        if (!Object.values(PointsEnum).includes(points)) {
            return Either.makeLeft(DomainErrorFactory.validation(
                domainContext,
                { value: ['INVALID_POINTS_VALUE'] },
                `El valor de puntos (${points}) no es un valor permitido.`
            ));
        }

        return Either.makeRight(new Points(points));
    }
    
    public get value(): number { return this.properties.value; }
}