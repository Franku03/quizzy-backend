import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
import { PlainPassword } from "./user.plain-password";

interface HashedPasswordProps {
    readonly value: string;
}

export class HashedPassword extends ValueObject<HashedPasswordProps> {
    
    constructor(value: string) {
        if (!value) throw new Error("El hash no puede estar vacío");
        super({ value });
    }

    get value(): string {
        return this.properties.value;
    }

    public async match(plain: PlainPassword, hasher: IPasswordHasher): Promise<boolean> {
        return hasher.compare(plain.value, this.value);
    }
}