import { Optional } from '../../../../core/types/optional';
import { GroupReadModel } from '../read-model/group.read.model';
import { GroupLeaderboardReadModel } from '../read-model/group.leaderboard.model';
import { KahootLeaderboardReadModel } from '../read-model/kahoot.leaderboard.model';
import { GroupQuizAssignmentReadModel } from '../read-model/group.quiz.assignment.model';

export interface IGroupsDao {
    getGroupsByUserId(userId: string): Promise<Optional<GroupReadModel[]>>;
    getGroupLeaderboard(groupId: string): Promise<Optional<GroupLeaderboardReadModel[]>>;
    getKahootLeaderboard(groupId: string, quizId: string): Promise<Optional<KahootLeaderboardReadModel>>;
    getGroupQuizzes(groupId: string, userId: string): Promise<Optional<GroupQuizAssignmentReadModel[]>>;
}