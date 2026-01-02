export class GetGroupMembersQuery {
    constructor(
        public readonly userId: string,
        public readonly groupId: string,
    ) { }
}

