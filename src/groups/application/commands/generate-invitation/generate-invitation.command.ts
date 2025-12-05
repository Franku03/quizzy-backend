export class GenerateInvitationCommand {
    constructor(
        public readonly groupId: string,
        public readonly adminId: string,
        public readonly expiresInDays: number
    ) { }
}