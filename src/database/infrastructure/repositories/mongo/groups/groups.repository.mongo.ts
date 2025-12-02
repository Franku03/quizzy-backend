import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGroupRepository } from 'src/database/domain/repositories/groups/IGroupRepository';
import { GroupMongo } from 'src/database/infrastructure/entities/mongo/groups/groups.schema';
import { Group } from 'src/groups/domain/aggregates/group';

@Injectable()
export class GroupRepositoryMongo implements IGroupRepository {
    constructor(
        @InjectModel(GroupMongo.name)
        private readonly groupModel: Model<GroupMongo>,
    ) { }


    //pending: revisar, OJO
    async save(group: Group): Promise<void> {
        await this.groupModel.create({
            groupId: group.id.value,
            adminId: group.getAdminId().value,
            name: group.getName(),
        });
    }
}