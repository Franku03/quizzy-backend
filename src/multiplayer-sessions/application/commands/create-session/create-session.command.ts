import { ICommand } from "src/core/application/cqrs/command.interface";

export class CreateSessionCommand implements ICommand {

    constructor(
        public readonly kahootId: string,
        public readonly hostId: string
    ){}

}