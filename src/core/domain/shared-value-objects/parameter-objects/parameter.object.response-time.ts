import { ValueObject } from "src/core/domain/abstractions/value.object";

interface ResponseTimeProps {
    readonly valueInSeconds: number;
}

export class ResponseTime extends ValueObject<ResponseTimeProps> {
    
    public constructor(valueInSeconds: number) {
        if (valueInSeconds < 0 || !Number.isFinite(valueInSeconds)) {
            throw new Error("El tiempo debe ser un número finito no negativo.");
        }
        super({ valueInSeconds });
    }
    public static fromSeconds(seconds: number): ResponseTime {
        return new ResponseTime(seconds); 
    }

    public static fromMinutes(minutes: number): ResponseTime {
        const seconds = minutes * 60;
        return new ResponseTime(seconds); 
    }
    
    public static fromMilliseconds(milliseconds: number): ResponseTime {
        const seconds = milliseconds / 1000;
        return new ResponseTime(seconds); 
    }
    public toSeconds(): number {
        return this.properties.valueInSeconds;
    }
    
    public toMilliseconds(): number {
        return this.properties.valueInSeconds * 1000;
    }
    public equals(other: ResponseTime): boolean {
        return super.equals(other);
    }
}