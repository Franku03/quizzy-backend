import { ICommand } from "@nestjs/cqrs";

export class GetPinWithQrTokenCommand implements ICommand {

    constructor(
        public readonly qrToken: string
    ){}

}