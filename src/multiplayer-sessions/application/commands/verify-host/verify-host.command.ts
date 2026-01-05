import { ICommand } from "src/core/application/cqrs";

export class VerifyHostCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
        public readonly hostId: string,
    ){}

}