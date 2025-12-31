import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Optional } from 'src/core/types/optional';
import { IGroupsDao } from 'src/groups/application/queries/ports/groups.dao.port';
import { GroupMongo } from '../../entities/groups.schema';
import { GroupReadModel } from 'src/groups/application/queries/read-model/group.read.model';
import { GroupLeaderboardReadModel } from 'src/groups/application/queries/read-model/group.leaderboard.model';
import { UserMongo } from '../../entities/users.schema';
import { KahootLeaderboardReadModel } from 'src/groups/application/queries/read-model/kahoot.leaderboard.model';

@Injectable()
export class GroupDaoMongo implements IGroupsDao {
    constructor(
        @InjectModel(GroupMongo.name)
        private readonly groupModel: Model<GroupMongo>,
        @InjectModel(UserMongo.name)
        private readonly userModel: Model<UserMongo>,
    ) { }

    async getGroupsByUserId(userId: string): Promise<Optional<GroupReadModel[]>> {
        const groups = await this.groupModel.find({ members: { $elemMatch: { id: userId } } }).exec();
        if (!groups) return new Optional<GroupReadModel[]>();

        return new Optional<GroupReadModel[]>(groups.map(group => new GroupReadModel(group.groupId, group.name, group.members.find(member => member.id === userId)?.role ?? '', group.members.length, group.createdAt)));
    }


    async getGroupLeaderboard(groupId: string): Promise<Optional<GroupLeaderboardReadModel[]>> {
        const group = await this.groupModel.findOne({ groupId }).exec();

        if (!group || !group.completions || group.completions.length === 0) {
            return new Optional<GroupLeaderboardReadModel[]>();
        }

        // Aggregate completions by userId
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

        // Get all unique user IDs
        const userIds = Array.from(userStats.keys());

        // Fetch user information
        const users = await this.userModel.find({ userId: { $in: userIds } }).exec();
        const userMap = new Map<string, string>();
        users.forEach(user => {
            userMap.set(user.userId, user.username);
        });

        // Build leaderboard entries
        const leaderboardEntries = Array.from(userStats.entries()).map(([userId, stats]) => ({
            userId,
            name: userMap.get(userId) || 'Unknown User',
            completedQuizzes: stats.completedQuizzes.size,
            totalPoints: stats.totalPoints,
        }));

        // Sort by totalPoints descending, then by completedQuizzes descending
        leaderboardEntries.sort((a, b) => {
            if (b.totalPoints !== a.totalPoints) {
                return b.totalPoints - a.totalPoints;
            }
            return b.completedQuizzes - a.completedQuizzes;
        });

        // Map to read models with positions
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
        const group = await this.groupModel.findOne({ groupId }).exec();
        if (!group || !group.completions || group.completions.length === 0) {
            return new Optional<KahootLeaderboardReadModel>();
        }


        const quizCompletions = group.completions.filter(completion => completion.quizId === quizId);

        if (quizCompletions.length === 0) {
            return new Optional<KahootLeaderboardReadModel>();
        }


        const userIds = [...new Set(quizCompletions.map(completion => completion.userId))];


        const users = await this.userModel.find({ userId: { $in: userIds } }).exec();
        const userMap = new Map<string, string>();
        users.forEach(user => {
            userMap.set(user.userId, user.username);
        });


        const leaderboardEntries = quizCompletions.map(completion => ({
            userId: completion.userId,
            name: userMap.get(completion.userId) || 'Unknown User',
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
}