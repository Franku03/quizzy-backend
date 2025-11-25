import { ValueObject } from "src/core/domain/value.object";

interface ResponseTimeProps {
    readonly valueInSeconds: number;
}

export class ResponseTime extends ValueObject<ResponseTimeProps> {
    
    public constructor(valueInSeconds: number) {
        if (valueInSeconds < 0) {
            throw new Error("El tiempo no puede ser negativo.");
        }
        if (!Number.isFinite(valueInSeconds)) {
            throw new Error("El tiempo debe ser un número finito.");
        }
        super({ valueInSeconds });
    }
    
    public toSeconds(): number {return Math.floor(this.properties.valueInSeconds);}

}