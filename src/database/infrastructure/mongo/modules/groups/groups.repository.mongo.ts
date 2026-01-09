/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\mongo\modules\groups\groups.repository.mongo.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { GroupMongo } from 'src/database/infrastructure/mongo/entities/groups.schema';
import { Group } from 'src/groups/domain/aggregates/group';
import { GroupMapper } from 'src/groups/infrastructure/mappers/group.mapper';
import { Optional } from 'src/core/types/optional';
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

@RepositoryMongo(RepositoryName.Group)
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

    async findById(groupId: string): Promise<Optional<Group>> {
        const document = await this.groupModel.findOne({ groupId }).exec();

        if (!document) {
            return new Optional<Group>();
        }

        const group = GroupMapper.toDomain(document);
        return new Optional<Group>(group);
    }

    async findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]> {
        const documents = await this.groupModel.find({
            members: { $elemMatch: { id: userId } },
            assignments: { $elemMatch: { quizId: kahootId } }
        }).exec();

        return documents.map(doc => GroupMapper.toDomain(doc));
    }

    async findByInvitationToken(token: string): Promise<Optional<Group>> {
        const document = await this.groupModel.findOne({
            'invitationToken.value': token
        }).exec();

        if (!document) {
            return new Optional<Group>();
        }
        return new Optional<Group>(GroupMapper.toDomain(document));
    }

    async delete(groupId: string): Promise<void> {
        await this.groupModel.deleteOne({ groupId }).exec();
    }
}