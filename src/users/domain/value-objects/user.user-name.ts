import { ValueObject } from "src/core/domain/abstractions/value.object";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

interface UserNameProps {
    readonly value: string;
}

export class UserName extends ValueObject<UserNameProps> {

    constructor(value: string) {
        UserName.ensureLengthIsCorrect(value);
        UserName.ensureAllowedCharacters(value);
        
        super({ value });
    }

    
    private static ensureLengthIsCorrect(value: string): void {
        if (value.length < 6 || value.length > 20) {
            throw new InvalidArgumentError(`The username must be between 6 and 20 characters. Received: ${value.length}.`);
        }
    }
    
    private static ensureAllowedCharacters(value: string): void {
        const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
        
        if (!validUsernameRegex.test(value)) {
            throw new InvalidArgumentError(`The username <${value}> contains invalid characters. Only letters, numbers, and underscores are allowed.`);
        }
    }

    get value(): string {
        return this.properties.value;
    }
}