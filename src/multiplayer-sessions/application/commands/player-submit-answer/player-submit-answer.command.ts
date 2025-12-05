import { ICommand } from "@nestjs/cqrs";

export class PlayerSubmitAnswerCommand implements ICommand {

    constructor(
        public readonly questionId: string,
        public readonly answerId: string[],
        public readonly timeElapsedMs: number,
        public readonly sessionPin: string,
        public readonly userId: string,
    ){}

}