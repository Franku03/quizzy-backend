export class GetGroupLeaderboardQuery {
    constructor(
        public readonly userId: string,
        public readonly groupId: string
    ) { }
}