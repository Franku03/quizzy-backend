export class UserEmail {

    readonly value: string;

    constructor(value: string) {
        this.ensureIsValidEmail(value);
        this.value = value;
    }

    private ensureIsValidEmail(value: string): void {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        
        if (!emailRegex.test(value)) {
            throw new Error(`El email <${value}> no es válido.`);
        }
    }

    equals(other: UserEmail): boolean {
        return this.value === other.value;
    }
    
    toString(): string {
        return this.value;
    }
}