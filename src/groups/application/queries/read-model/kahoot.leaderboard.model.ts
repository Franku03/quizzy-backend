export class KahootLeaderboardReadModel {
    constructor(
        public readonly quizId: string,
        public readonly groupId: string,
        public readonly topPlayers: Object[],
    ) { }
}