import { Group } from "src/groups/domain/aggregates/group";

export interface IGroupRepository {
    save(group: Group): Promise<void>;
    findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]>;
}