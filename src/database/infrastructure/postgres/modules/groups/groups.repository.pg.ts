import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IGroupRepository } from 'src/groups/domain/ports/IGroupRepository';
import { GroupEntity } from '../../entities/groups/group.entity.pg';
import { Group } from 'src/groups/domain/aggregates/group';
import { GroupMapper, GroupPersistenceData } from 'src/groups/infrastructure/mappers/group.mapper';
import { Optional } from 'src/core/types/optional';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

function entityToPersistenceData(entity: GroupEntity): GroupPersistenceData {
    return {
        groupId: entity.groupId,
        adminId: entity.adminId,
        name: entity.name,
        description: entity.description,
        createdAt: entity.createdAt,
        members: entity.members || [],
        assignments: entity.assignments || [],
        completions: entity.completions || [],
        invitationToken: entity.invitationToken,
    };
}

@RepositoryPostgres(RepositoryName.Group)
@Injectable()
export class GroupRepository implements IGroupRepository {
    constructor(
        @InjectRepository(GroupEntity)
        private readonly groupRepository: Repository<GroupEntity>,
    ) { }

    async save(group: Group): Promise<void> {
        const persistenceData = GroupMapper.toPersistence(group);

        const entityData = {
            groupId: persistenceData.groupId,
            adminId: persistenceData.adminId,
            name: persistenceData.name,
            description: persistenceData.description,
            createdAt: persistenceData.createdAt,
            members: persistenceData.members,
            assignments: persistenceData.assignments,
            completions: persistenceData.completions,
            invitationToken: persistenceData.invitationToken,
        };

        await this.groupRepository.save(entityData);
    }

    async findById(groupId: string): Promise<Optional<Group>> {
        const entity = await this.groupRepository.findOne({
            where: { groupId }
        });

        if (!entity) {
            return new Optional<Group>();
        }

        const persistenceData = entityToPersistenceData(entity);
        const group = GroupMapper.toDomain(persistenceData);
        return new Optional<Group>(group);
    }

    async findByMemberAndKahoot(userId: string, kahootId: string): Promise<Group[]> {
        const entities = await this.groupRepository
            .createQueryBuilder('group')
            .where('group.members @> :memberFilter', {
                memberFilter: JSON.stringify([{ id: userId }])
            })
            .andWhere('group.assignments @> :assignmentFilter', {
                assignmentFilter: JSON.stringify([{ quizId: kahootId }])
            })
            .getMany();

        return entities.map(entity => {
            const persistenceData = entityToPersistenceData(entity);
            return GroupMapper.toDomain(persistenceData);
        });
    }

    async findByInvitationToken(token: string): Promise<Optional<Group>> {
        const entity = await this.groupRepository
            .createQueryBuilder('group')
            .where('group.invitationToken::jsonb->>\'value\' = :token', { token })
            .getOne();

        if (!entity) {
            return new Optional<Group>();
        }

        const persistenceData = entityToPersistenceData(entity);
        return new Optional<Group>(GroupMapper.toDomain(persistenceData));
    }

    async delete(groupId: string): Promise<void> {
        await this.groupRepository.delete({ groupId });
    }
}
