/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\domain\value-objects\group.member.role.ts

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

    public get value(): GroupMemberRole {
        return this.properties.value;
    }
}