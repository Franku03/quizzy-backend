import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateSessionCommand } from "./create-session.command";

import { Inject } from "@nestjs/common";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { GetPinWithQrTokenResponse } from "../response-dtos/get-pin-with-qr-token.response.dto";
import { GetPinWithQrToken } from "./get-pin-with-qr-token.command copy";


@CommandHandler( GetPinWithQrToken )
export class CreateSessionHandler implements ICommandHandler<GetPinWithQrToken> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){}

    async execute(command: GetPinWithQrToken): Promise<GetPinWithQrTokenResponse> {


        const searchedSession = await this.sessionRepository.findSessionByQrToken( command.qrToken );

        if( !searchedSession )
            throw new Error("El token obtenido a traves del codigo QR no corresponde a ninguna Sessión");

        const pin = searchedSession.session.getSessionPin().getPin();
        const sessionId = searchedSession.session.id.value;


        return { sessionPin: pin, sessionId: sessionId }

    }

}