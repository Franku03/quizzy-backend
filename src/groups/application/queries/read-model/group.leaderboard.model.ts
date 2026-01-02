export class GroupLeaderboardReadModel {
    constructor(
        public readonly userId: string,
        public readonly name: string,
        public readonly completedQuizzes: number,
        public readonly totalPoints: number,
        public readonly position: number,
    ) { }
}