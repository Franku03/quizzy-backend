export class GroupMemberReadModel {
    constructor(
        public readonly userId: string,
        public readonly role: string,
        public readonly joinedAt: Date,
    ) { }
}

