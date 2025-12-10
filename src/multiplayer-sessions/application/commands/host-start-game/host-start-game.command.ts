import { ICommand } from "src/core/application/cqrs";

export class HostStartGameCommand implements ICommand {

    constructor(
        public readonly sessionPin
    ){}

}