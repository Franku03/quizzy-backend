import { ICommand } from "src/core/application/cqrs";

export class VerifyConnectionAvailabilityCommand implements ICommand {

    constructor(
        public readonly sessionPin: string,
        public readonly userId: string,
    ){}

}