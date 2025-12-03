export class ModifyGroupInformationCommand {
    constructor(public readonly groupId: string, public readonly userId: string, public readonly name?: string, public readonly description?: string) { }
}