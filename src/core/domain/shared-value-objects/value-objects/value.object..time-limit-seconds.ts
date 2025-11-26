import { ValueObject } from "src/core/domain/abstractions/value.object";

enum TimeLimitSecondsEnum {
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
        
        if (!Number.isInteger(seconds) || seconds <= 0) {
            throw new Error("El límite de tiempo debe ser un número entero positivo (mayor a 0).");
        }
        
        if (!Object.values(TimeLimitSecondsEnum).includes(seconds)) {
            throw new Error(`El valor de tiempo (${seconds}s) no es un valor permitido.`);
        }
        
        super({ value: seconds });
    }
    
    public get value(): number {return this.properties.value;}
}