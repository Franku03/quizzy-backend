import { ValueObject } from "src/core/domain/abstractions/value.object";

interface GroupInvitationTokenProps {
    readonly value: number;
    readonly expiresAt: Date;
}


//pending: implementar
export class InvitationToken extends ValueObject<GroupInvitationTokenProps> {
    constructor(value: number, expiresAt: Date) {
        super({ value, expiresAt });
    }


    public static create(expiresInDays: number): InvitationToken {
        return new InvitationToken(expiresInDays, new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000));
    }
}