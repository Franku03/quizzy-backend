import { ICommand } from "@nestjs/cqrs";

export class CreateSessionCommand implements ICommand {

    constructor(public readonly kahootId: string){}

}