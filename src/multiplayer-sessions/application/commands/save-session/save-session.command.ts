import { ICommand } from "@nestjs/cqrs";

export class SaveSessionCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
    ){}

}