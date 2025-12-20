export class TransferAdminCommand {
    constructor(public readonly groupId: string, public readonly userId: string, public readonly newAdminId: string) { }
}