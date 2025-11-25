import { ValueObject } from "src/core/domain/value.object";

enum PointsEnum {
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
        
        if (!Number.isInteger(points) || points < 0) {
            throw new Error("Los puntos deben ser un número entero positivo o cero.");
        }
        if (!Object.values(PointsEnum).includes(points)) {
            throw new Error(`El valor de puntos (${points}) no es un valor permitido.`);
        }
        
        super({ value: points });
    }
    
    public get value(): number {
        return this.properties.value;
    }
}