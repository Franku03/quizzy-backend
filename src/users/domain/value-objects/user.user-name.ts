import { ValueObject } from "src/core/domain/abstractions/value.object";

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
            throw new Error(`El nombre de usuario debe tener entre 6 y 20 caracteres. Recibido: ${value.length}`);
        }
    }
    
    private static ensureAllowedCharacters(value: string): void {
        const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
        
        if (!validUsernameRegex.test(value)) {
            throw new Error(`El nombre de usuario <${value}> contiene caracteres inválidos. Solo se permiten letras, números y guiones bajos.`);
        }
    }

    get value(): string {
        return this.properties.value;
    }
}