import { ICommand } from "src/core/application/cqrs";

export class GetPinWithQrTokenCommand implements ICommand {

    constructor(
        public readonly qrToken: string
    ){}

}