import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Optional } from 'src/core/types/optional';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { GroupEntity } from '../../entities/groups/group.entity.pg';
import { GroupReadModel } from 'src/groups/application/queries/read-model/group.read.model';
import { GroupLeaderboardReadModel } from 'src/groups/application/queries/read-model/group.leaderboard.model';
import { KahootLeaderboardReadModel } from 'src/groups/application/queries/read-model/kahoot.leaderboard.model';
import { GroupQuizAssignmentReadModel, UserResultModel } from 'src/groups/application/queries/read-model/group.quiz.assignment.model';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoPostgres(DaoName.Group)
@Injectable()
export class GroupsDao implements IGroupsDao {
    constructor(
        @InjectRepository(GroupEntity)
        private readonly groupRepository: Repository<GroupEntity>,
    ) { }

    private async findGroupById(groupId: string): Promise<GroupEntity | null> {
        return await this.groupRepository.findOne({
            where: { groupId }
        });
    }

    async getGroupsByUserId(userId: string): Promise<Optional<GroupReadModel[]>> {
        const groups = await this.groupRepository
            .createQueryBuilder('g')
            .where('g.members @> :memberFilter', {
                memberFilter: JSON.stringify([{ id: userId }])
            })
            .getMany();

        if (!groups || groups.length === 0) {
            return new Optional<GroupReadModel[]>();
        }

        const readModels = groups.map(group => {
            const member = group.members.find(m => m.id === userId || m.userId === userId);
            return new GroupReadModel(
                group.groupId,
                group.name,
                group.description ?? '',
                member?.role ?? '',
                group.members.length,
                group.createdAt
            );
        });

        return new Optional<GroupReadModel[]>(readModels);
    }

    async getGroupLeaderboard(groupId: string): Promise<Optional<GroupLeaderboardReadModel[]>> {
        const group = await this.findGroupById(groupId);

        if (!group || !group.completions || group.completions.length === 0) {
            return new Optional<GroupLeaderboardReadModel[]>();
        }

        const userStats = new Map<string, { completedQuizzes: Set<string>, totalPoints: number }>();

        for (const completion of group.completions) {
            const userId = completion.userId;
            if (!userStats.has(userId)) {
                userStats.set(userId, { completedQuizzes: new Set<string>(), totalPoints: 0 });
            }
            const stats = userStats.get(userId)!;
            stats.completedQuizzes.add(completion.quizId);
            stats.totalPoints += completion.score || 0;
        }

        const userIds = Array.from(userStats.keys());

        const leaderboardEntries = Array.from(userStats.entries()).map(([userId, stats]) => ({
            userId,
            name: userId,
            completedQuizzes: stats.completedQuizzes.size,
            totalPoints: stats.totalPoints,
        }));

        leaderboardEntries.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return b.completedQuizzes - a.completedQuizzes;
        });

        const leaderboard = leaderboardEntries.map((entry, index) =>
            new GroupLeaderboardReadModel(
                entry.userId,
                entry.name,
                entry.completedQuizzes,
                entry.totalPoints,
                index + 1
            )
        );

        return new Optional<GroupLeaderboardReadModel[]>(leaderboard);
    }

    async getKahootLeaderboard(groupId: string, quizId: string): Promise<Optional<KahootLeaderboardReadModel>> {
        const group = await this.findGroupById(groupId);

        if (!group || !group.completions || group.completions.length === 0) {
            return new Optional<KahootLeaderboardReadModel>();
        }

        const quizCompletions = group.completions.filter(completion => completion.quizId === quizId);

        if (quizCompletions.length === 0) {
            return new Optional<KahootLeaderboardReadModel>();
        }

        const userIds = [...new Set(quizCompletions.map(completion => completion.userId))];

        const leaderboardEntries = quizCompletions.map(completion => ({
            userId: completion.userId,
            name: completion.userId,
            score: completion.score || 0,
        }));

        leaderboardEntries.sort((a, b) => b.score - a.score);

        const topPlayers = leaderboardEntries.map(entry => ({
            userId: entry.userId,
            name: entry.name,
            score: entry.score,
        }));

        const leaderboard = new KahootLeaderboardReadModel(quizId, groupId, topPlayers);
        return new Optional<KahootLeaderboardReadModel>(leaderboard);
    }

    async getGroupQuizzes(groupId: string, userId: string): Promise<Optional<GroupQuizAssignmentReadModel[]>> {
        const group = await this.findGroupById(groupId);

        if (!group || !group.assignments || group.assignments.length === 0) {
            return new Optional<GroupQuizAssignmentReadModel[]>([]);
        }

        const quizAssignments: GroupQuizAssignmentReadModel[] = [];

        for (const assignment of group.assignments) {
            const quizId = assignment.quizId;
            const title = 'Unknown Quiz';

            const userCompletion = group.completions.find(
                c => c.userId === userId && c.quizId === quizId
            );
            const status: 'COMPLETED' | 'PENDING' = userCompletion ? 'COMPLETED' : 'PENDING';

            let userResult: UserResultModel | null = null;
            if (userCompletion) {
                userResult = new UserResultModel(
                    userCompletion.score,
                    userCompletion.attemptId,
                    new Date()
                );
            }

            const leaderboardOptional = await this.getKahootLeaderboard(groupId, quizId);
            const leaderboard = leaderboardOptional.hasValue()
                ? leaderboardOptional.getValue().topPlayers.map((player: any) => ({
                    name: player.name,
                    score: player.score
                }))
                : [];

            quizAssignments.push(
                new GroupQuizAssignmentReadModel(
                    assignment.id,
                    quizId,
                    title,
                    assignment.availableUntil,
                    status,
                    userResult,
                    leaderboard
                )
            );
        }

        return new Optional<GroupQuizAssignmentReadModel[]>(quizAssignments);
    }

    async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
        const group = await this.groupRepository.findOne({
            where: { groupId },
            select: ['adminId']
        });

        if (!group) {
            return false;
        }

        return group.adminId === userId;
    }

    async isGroupMember(groupId: string, userId: string): Promise<boolean> {
        const group = await this.groupRepository
            .createQueryBuilder('g')
            .where('g.groupId = :groupId', { groupId })
            .andWhere(
                '(g.adminId = :userId OR g.members @> :memberFilter)',
                {
                    userId,
                    memberFilter: JSON.stringify([{ id: userId }])
                }
            )
            .select('g.groupId')
            .getOne();

        return !!group;
    }
}
