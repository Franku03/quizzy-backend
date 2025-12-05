export class AssignKahootToGroupCommand {
    constructor(
        public readonly groupId: string,
        public readonly userId: string,
        public readonly kahootId: string,
        public readonly availableFrom: Date,
        public readonly availableUntil: Date,
    ) { }
}