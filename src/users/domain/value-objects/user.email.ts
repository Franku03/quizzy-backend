import { ValueObject } from "src/core/domain/abstractions/value.object";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

interface UserEmailProps {
    readonly value: string;
}

export class UserEmail extends ValueObject<UserEmailProps> {

    constructor(value: string) {
        UserEmail.ensureIsValidEmail(value);
        
        super({ value }); 
    }
    
    private static ensureIsValidEmail(value: string): void {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        
        if (!emailRegex.test(value)) {
            throw new InvalidArgumentError(`El email <${value}> no es válido.`);
        }
    }

    get value(): string {
        return this.properties.value;
    }
}