import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { GroupMongo } from '../../entities/groups.schema';
import { GroupReadModel } from 'src/groups/application/queries/read-model/group.read.model';

@Injectable()
export class GroupDaoMongo implements IGroupsDao {
    constructor(
        @InjectModel(GroupMongo.name)
        private readonly groupModel: Model<GroupMongo>,
    ) { }

    async getGroupsByUserId(userId: string): Promise<Optional<GroupReadModel[]>> {
        const groups = await this.groupModel.find({ members: { $elemMatch: { id: userId } } }).exec();
        if (!groups) return new Optional<GroupReadModel[]>();

        return new Optional<GroupReadModel[]>(groups.map(group => new GroupReadModel(group.groupId, group.name, group.members.find(member => member.id === userId)?.role ?? '', group.members.length, group.createdAt)));
    }
}