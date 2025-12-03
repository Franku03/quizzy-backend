import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGroupRepository } from 'src/database/domain/repositories/groups/IGroupRepository';
import { GroupMongo } from 'src/database/infrastructure/mongo/entities/groups.schema';
import { Group } from 'src/groups/domain/aggregates/group';
import { GroupMapper } from 'src/groups/infrastructure/mappers/group.mapper';

@Injectable()
export class GroupRepositoryMongo implements IGroupRepository {
    constructor(
        @InjectModel(GroupMongo.name)
        private readonly groupModel: Model<GroupMongo>,
    ) { }

    async save(group: Group): Promise<void> {
        const persistenceData = GroupMapper.toPersistence(group);

        await this.groupModel.updateOne(
            { groupId: persistenceData.groupId },
            { $set: persistenceData },
            { upsert: true }
        ).exec();
    }

    async findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]> {
        const documents = await this.groupModel.find({
            members: { $elemMatch: { userId: userId } },
            assignments: { $elemMatch: { quizId: kahootId } }
        }).exec();

        return documents.map(doc => GroupMapper.toDomain(doc));
    }
}