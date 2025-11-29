import { ValueObject } from "src/core/domain/abstractions/value.object";
import { ITokenGenerator } from "../domain-services/i.token-generator.service.interface";

interface GroupInvitationTokenProps {
    readonly value: string;
    readonly expiresAt: Date;
}

export class InvitationToken extends ValueObject<GroupInvitationTokenProps> {
    private constructor(value: string, expiresAt: Date) {
        if (!value || value.trim().length === 0) {
            throw new Error("El token de invitación no puede estar vacío.");
        }

        if (!expiresAt) {
            throw new Error("La fecha de expiración es requerida.");
        }
        super({ value, expiresAt });
    }


    public static createWithTokenGenerator(tokenGenerator: ITokenGenerator, expiresInDays: number): InvitationToken {
        if (expiresInDays < 1) {
            throw new Error("La invitación debe tener una duración mínima de 1 día.");
        }

        const tokenValue = tokenGenerator.generate();
        const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
        
        return new InvitationToken(tokenValue, expiresAt);
    }


    public static create(tokenValue: string, expiresAt: Date): InvitationToken {
        return new InvitationToken(tokenValue, expiresAt);
    }


    public static fromPrimitives(value: string, expiresAt: Date): InvitationToken {
        return new InvitationToken(value, expiresAt);
    }

    public getValue(): string {
        return this.properties.value;
    }

    public getExpiresAt(): Date {
        return this.properties.expiresAt;
    }

    public isExpired(): boolean {
        return this.properties.expiresAt < new Date();
    }

    public equals(other: InvitationToken): boolean {
        return super.equals(other);
    }
}