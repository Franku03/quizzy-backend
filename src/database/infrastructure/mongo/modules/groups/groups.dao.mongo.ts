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
import { KahootMongo } from '../../entities/kahoots.schema';
import { AttemptMongo } from '../../entities/attempts.scheme';
import { GroupQuizAssignmentReadModel, UserResultModel } from 'src/groups/application/queries/read-model/group.quiz.assignment.model';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoMongo(DaoName.Group)
@Injectable()
export class GroupDaoMongo implements IGroupsDao {
    constructor(
        @InjectModel(GroupMongo.name)
        private readonly groupModel: Model<GroupMongo>,
        @InjectModel(UserMongo.name)
        private readonly userModel: Model<UserMongo>,
        @InjectModel(KahootMongo.name)
        private readonly kahootModel: Model<KahootMongo>,
        @InjectModel(AttemptMongo.name)
        private readonly attemptModel: Model<AttemptMongo>,
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

    async getGroupQuizzes(groupId: string, userId: string): Promise<Optional<GroupQuizAssignmentReadModel[]>> {
        const group = await this.groupModel.findOne({ groupId }).exec();

        if (!group || !group.assignments || group.assignments.length === 0) {
            return new Optional<GroupQuizAssignmentReadModel[]>([]);
        }

        const quizIds = group.assignments.map(assignment => assignment.quizId);

        const kahoots = await this.kahootModel.find({ id: { $in: quizIds } }).exec();
        const kahootMap = new Map<string, { title: string }>();
        kahoots.forEach(kahoot => {
            kahootMap.set(kahoot.id, { title: kahoot.details?.title || 'Unknown Quiz' });
        });

        const userCompletionsMap = new Map<string, { attemptId: string; score: number }>();
        group.completions
            .filter(c => c.userId === userId)
            .forEach(c => {
                userCompletionsMap.set(c.quizId, { attemptId: c.attemptId, score: c.score });
            });

        const attemptIds = Array.from(userCompletionsMap.values()).map(c => c.attemptId);
        const attemptMap = new Map<string, Date | null>();
        if (attemptIds.length > 0) {
            const attempts = await this.attemptModel.find({ id: { $in: attemptIds } }).exec();
            attempts.forEach(attempt => {
                attemptMap.set(attempt.id, attempt.timeDetails?.completedAt || null);
            });
        }


        const quizAssignments: GroupQuizAssignmentReadModel[] = [];

        for (const assignment of group.assignments) {
            const quizId = assignment.quizId;
            const kahoot = kahootMap.get(quizId);
            const title = kahoot?.title || 'Unknown Quiz';


            const userCompletion = userCompletionsMap.get(quizId);
            const status: 'COMPLETED' | 'PENDING' = userCompletion ? 'COMPLETED' : 'PENDING';


            let userResult: UserResultModel | null = null;
            if (userCompletion) {
                const completedAt = attemptMap.get(userCompletion.attemptId);
                if (completedAt) {
                    userResult = new UserResultModel(
                        userCompletion.score,
                        userCompletion.attemptId,
                        completedAt
                    );
                }
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
        const group = await this.groupModel
            .findOne({ groupId })
            .select({ adminId: 1 })
            .lean()
            .exec();
        
        if (!group) {
            return false;
        }
        
        return group.adminId === userId;
    }

    async isGroupMember(groupId: string, userId: string): Promise<boolean> {
        const group = await this.groupModel
            .findOne({ 
                groupId,
                $or: [
                    { adminId: userId },
                    { 'members.id': userId }
                ]
            })
            .select({ groupId: 1 })
            .lean()
            .exec();
        
        return !!group;
    }
}