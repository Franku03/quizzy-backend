import { ICommand } from "@nestjs/cqrs";

export class HostNextPhaseCommand implements ICommand {

    constructor(
        public readonly sessionPin
    ){}

}