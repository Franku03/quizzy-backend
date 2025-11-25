import { ValueObject } from "src/core/domain/value.object";

interface PlayNumberProps {
    readonly count: number;
}

export class PlayNumber extends ValueObject<PlayNumberProps> {
    
    public constructor(count: number) {
        
        if (!Number.isInteger(count)) {
            throw new Error("PlayNumber debe ser un número entero.");
        }
        if (count < 0) {
            throw new Error("PlayNumber no puede ser negativo.");
        }
        super({ count });
    }
    
    public static readonly ZERO = new PlayNumber(0);

    public Increment(): PlayNumber {
        return new PlayNumber(this.properties.count + 1);
    }
    
    public get count(): number {return this.properties.count;}
}