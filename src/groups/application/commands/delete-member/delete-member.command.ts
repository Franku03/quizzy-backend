export class DeleteMemberCommand {
    constructor(public readonly groupId: string, public readonly userId: string, public readonly targetUserId: string) { }
}