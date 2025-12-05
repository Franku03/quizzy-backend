export class CreateGroupCommand {
    constructor(public readonly name: string, public readonly adminId: string, public readonly description?: string) { }
}