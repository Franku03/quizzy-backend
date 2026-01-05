import { ICommand } from "src/core/application/cqrs";

export class SyncStateCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
        public readonly userId: string,
        // public readonly role: string,
    ){}

}