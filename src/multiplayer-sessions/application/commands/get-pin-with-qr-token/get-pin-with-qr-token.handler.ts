
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { Inject } from "@nestjs/common";
import { InMemoryActiveSessionRepository  } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { QR_TOKEN_ERRORS } from "./get-pin-with-qr-token.errors";
import { GetPinWithQrTokenResponse } from "../../response-dtos/get-pin-with-qr-token.response.dto";
import { GetPinWithQrTokenCommand } from "./get-pin-with-qr-token.command";

import { Either } from '../../../../core/types/either';
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";


@CommandHandler( GetPinWithQrTokenCommand )
export class GetPinWithQrTokenHandler implements ICommandHandler<GetPinWithQrTokenCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,
    ){}

    async execute(command: GetPinWithQrTokenCommand): Promise<Either<Error,GetPinWithQrTokenResponse>> {


        try {
            
            const searchedSession = await this.sessionRepository.findByTemporalToken( command.qrToken );
    
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