import { ICommand } from "@nestjs/cqrs";

export class HostStartGameCommand implements ICommand {

    constructor(
        public readonly sessionPin
    ){}

}