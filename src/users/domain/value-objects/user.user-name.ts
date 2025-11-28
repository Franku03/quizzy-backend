export class UserName {
    readonly value: string;

    constructor(value: string) {
        this.ensureLengthIsCorrect(value);
        this.ensureAllowedCharacters(value);
        
        this.value = value;
    }

    private ensureLengthIsCorrect(value: string): void {
        if (value.length < 6 || value.length > 20) {
            throw new Error(`El nombre de usuario debe tener entre 6 y 20 caracteres. Recibido: ${value.length}`);
        }
    }

    private ensureAllowedCharacters(value: string): void {

        const validUsernameRegex = /^[a-zA-Z0-9_]+$/;

        if (!validUsernameRegex.test(value)) {
            throw new Error(`El nombre de usuario <${value}> contiene caracteres inválidos. Solo se permiten letras, números y guiones bajos.`);
        }
    }

    equals(other: UserName): boolean {
        return this.value === other.value;
    }
}