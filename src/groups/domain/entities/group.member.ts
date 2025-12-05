import { Entity } from "src/core/domain/abstractions/entity";
import { Role } from "../value-objects/group.member.role";
import { GroupMemberId } from "../value-objects/group.member.id";
import { UserId } from "src/core/domain/shared-value-objects/id-objects/user.id";	



export interface GroupMemberProps {
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

    public getRole(): Role {
        return this.properties.role;
    }

    public getJoinedAt(): Date {
        return this.properties.joinedAt;
    }


    public toPrimitives() {
        return {
            id: this.id.value,
            userId: this.properties.userId.value,
            role: this.properties.role.value,
            joinedAt: this.properties.joinedAt
        };
    }
}