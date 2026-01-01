import { ICommand } from "src/core/application/cqrs";

export class PlayerJoinCommand implements ICommand {

    constructor(
        public readonly userId: string,
        public readonly nickname: string,
        public readonly sessionPin: string,
    ){}

}