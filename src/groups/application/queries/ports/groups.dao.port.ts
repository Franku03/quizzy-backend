import { Optional } from '../../../../core/types/optional';
import { GroupReadModel } from '../read-model/group.read.model';

export interface IGroupsDao {
    getGroupsByUserId(userId: string): Promise<Optional<GroupReadModel[]>>;
}