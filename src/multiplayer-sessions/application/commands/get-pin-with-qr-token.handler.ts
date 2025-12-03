import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { Inject } from "@nestjs/common";
import { InMemorySessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { QR_TOKEN_ERRORS } from "./get-pin-with-qr-token.errors";
import { GetPinWithQrTokenResponse } from "../response-dtos/get-pin-with-qr-token.response.dto";
import { GetPinWithQrTokenCommand } from "./get-pin-with-qr-token.command";

import { Either } from '../../../core/types/either';


@CommandHandler( GetPinWithQrTokenCommand )
export class GetPinWithQrTokenHandler implements ICommandHandler<GetPinWithQrTokenCommand> {

    constructor(
        @Inject( InMemorySessionRepository )
        private readonly sessionRepository: InMemorySessionRepository,
    ){}

    async execute(command: GetPinWithQrTokenCommand): Promise<Either<Error,GetPinWithQrTokenResponse>> {


        try {
            
            const searchedSession = await this.sessionRepository.findSessionByQrToken( command.qrToken );
    
            if( !searchedSession )
               return Either.makeLeft( new Error(QR_TOKEN_ERRORS.QR_NOT_FOUND) );
    
            const pin = searchedSession.session.getSessionPin().getPin();
            const sessionId = searchedSession.session.id.value;
    
    
            return Either.makeRight({ sessionPin: pin, sessionId: sessionId })

        } catch (error) {
            
            return Either.makeLeft( error );
        }


    }

}