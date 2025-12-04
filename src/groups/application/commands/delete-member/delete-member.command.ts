export class DeleteMemberCommand {
    constructor(public readonly groupId: string, public readonly requesterId: string, public readonly targetUserId: string) { }
}