import { Group } from "src/groups/domain/aggregates/group";

export interface IGroupRepository {
    save(group: Group): Promise<void>;
    findById(id: string): Promise<Group | null>;
    findByUserId(userId: string): Promise<Group[]>;
    findByInvitationToken(token: string): Promise<Group | null>;
    delete(id: string): Promise<void>;
    exists(id: string): Promise<boolean>;
}