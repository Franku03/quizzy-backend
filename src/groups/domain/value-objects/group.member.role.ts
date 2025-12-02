import { ValueObject } from "src/core/domain/abstractions/value.object";

export enum GroupMemberRole {
    ADMIN = "ADMIN",
    MEMBER = "MEMBER",
}

interface GroupMemberRoleProps {
    readonly value: GroupMemberRole;
}

export class Role extends ValueObject<GroupMemberRoleProps> {
    constructor(value: GroupMemberRole) {
        if (value === null || value === undefined) {
            throw new Error("El rol es requerido.");
        }
        if (!Object.values(GroupMemberRole).includes(value)) {
            throw new Error(`El rol '${value}' no es válido.`);
        }
        super({ value });
    }
}