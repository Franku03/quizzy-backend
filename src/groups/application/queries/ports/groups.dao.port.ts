/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\groups\application\queries\ports\groups.dao.port.ts

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
    
    isGroupAdmin(groupId: string, userId: string): Promise<boolean>;
    isGroupMember(groupId: string, userId: string): Promise<boolean>;
}