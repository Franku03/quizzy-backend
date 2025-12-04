import { ICommand } from "@nestjs/cqrs";

export class JoinPlayerCommand implements ICommand {

    constructor(
        public readonly userId: string,
        public readonly nickname: string,
        public readonly sessionPin: string,
    ){}

}