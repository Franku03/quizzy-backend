/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\value-objects\user.plain-password.ts

import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
import { HashedPassword } from "./user.hashed-password";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

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
            throw new InvalidArgumentError("The password must be at least 6 characters long.");
        }
    }

    get value(): string {
        return this.properties.value;
    }
}