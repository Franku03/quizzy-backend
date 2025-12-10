import { ICommand } from "src/core/application/cqrs";

export class SaveSessionCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
    ){}

}