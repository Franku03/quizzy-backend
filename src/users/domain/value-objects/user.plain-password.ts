import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
import { HashedPassword } from "./user.hashed-password";

interface PlainPasswordProps {
    readonly value: string;
}

export class PlainPassword extends ValueObject<PlainPasswordProps> {
    
    constructor(value: string) {
        PlainPassword.ensureIsSecure(value);
        super({ value });
    }

    public async hash(hasher: IPasswordHasher): Promise<HashedPassword> {
        const hashedString = await hasher.hash(this.value);
        return new HashedPassword(hashedString);
    }
    
    private static ensureIsSecure(value: string): void {
        if (value.length < 6) {
            throw new Error("La contraseña debe tener al menos 6 caracteres.");
        }
    }

    get value(): string {
        return this.properties.value;
    }
}