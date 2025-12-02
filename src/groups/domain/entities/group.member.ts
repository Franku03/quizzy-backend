import { Entity } from "src/core/domain/abstractions/entity";
import { Role } from "../value-objects/group.member.role";
import { GroupMemberId } from "../value-objects/group.member.id";   


interface UserId {
    readonly value: string;
}


interface GroupMemberProps {
    userId: UserId;
    role: Role;
    joinedAt: Date;
}

export class GroupMember extends Entity<GroupMemberProps, GroupMemberId> {

    constructor(properties: GroupMemberProps, id: GroupMemberId) {
        if (properties.joinedAt > new Date()) {
            throw new Error("La fecha de unión no puede ser futura.");
        }

        super(properties, id);
    }

    public changeRole(role: Role): void {
        this.properties.role = role;
    }

    public getUserId(): UserId {
        return this.properties.userId;
    }
}