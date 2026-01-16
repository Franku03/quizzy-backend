/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\users\domain\value-objects\user.hashed-password.ts

import { ValueObject } from "src/core/domain/abstractions/value.object";
import { IPasswordHasher } from "../domain-services/i.password-hasher.interface";
import { PlainPassword } from "./user.plain-password";
import { InvalidArgumentError } from "../errors/invalid.argument.error";

interface HashedPasswordProps {
    readonly value: string;
}

export class HashedPassword extends ValueObject<HashedPasswordProps> {
    
    constructor(value: string) {
        if (!value) throw new InvalidArgumentError("The hash cannot be empty.");
        super({ value });
    }

    get value(): string {
        return this.properties.value;
    }

    public async match(plain: PlainPassword, hasher: IPasswordHasher): Promise<boolean> {
        return hasher.compare(plain.value, this.value);
    }
}