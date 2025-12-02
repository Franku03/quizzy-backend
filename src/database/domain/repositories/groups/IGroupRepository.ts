import { Group } from "src/groups/domain/aggregates/group";

export interface IGroupRepository {
    save(group: Group): Promise<void>;
}