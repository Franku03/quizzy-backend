import { ICommand } from "src/core/application/cqrs/command.interface";

export class DeleteSessionCommand implements ICommand {

    constructor(
        public readonly sessionPin: string
    ){}

}