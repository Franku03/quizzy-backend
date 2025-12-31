export class UserResultModel {
    constructor(
        public readonly score: number,
        public readonly attemptId: string,
        public readonly completedAt: Date,
    ) { }
}

export class GroupQuizAssignmentReadModel {
    constructor(
        public readonly assignmentId: string,
        public readonly quizId: string,
        public readonly title: string,
        public readonly availableUntil: Date,
        public readonly status: 'COMPLETED' | 'PENDING',
        public readonly userResult: UserResultModel | null,
        public readonly leaderboard: Array<{ name: string; score: number }>,
    ) { }
}

