export class GetKahootLeaderboardQuery {
    constructor(
        public readonly userId: string,
        public readonly groupId: string,
        public readonly quizId: string
    ) { }
}