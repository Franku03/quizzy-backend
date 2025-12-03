import { ICommand } from "@nestjs/cqrs";

export class GetPinWithQrToken implements ICommand {

    constructor(
        public readonly qrToken: string
    ){}

}