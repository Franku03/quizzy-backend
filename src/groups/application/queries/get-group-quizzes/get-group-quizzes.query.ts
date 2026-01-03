export class GetGroupQuizzesQuery {
    constructor(
        public readonly userId: string,
        public readonly groupId: string,
    ) { }
}

