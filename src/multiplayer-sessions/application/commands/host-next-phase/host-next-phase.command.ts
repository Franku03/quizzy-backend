import { ICommand } from "src/core/application/cqrs";

export class HostNextPhaseCommand implements ICommand {

    constructor(
        public readonly sessionPin
    ){}

}