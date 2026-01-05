import { ICommand } from "src/core/application/cqrs";

export class VerifyPinCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
    ){}

}