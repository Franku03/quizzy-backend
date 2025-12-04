import { Optional } from "src/core/types/optional";
import { Group } from "src/groups/domain/aggregates/group";

export interface IGroupRepository {
    save(group: Group): Promise<void>;
    findById(groupId: string): Promise<Optional<Group>>;
    findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]>;
}