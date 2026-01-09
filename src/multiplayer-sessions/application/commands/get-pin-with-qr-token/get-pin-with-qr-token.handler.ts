
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { Inject } from "@nestjs/common";
import { InMemoryActiveSessionRepository  } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { QR_TOKEN_ERRORS } from "./get-pin-with-qr-token.errors";
import { GetPinWithQrTokenResponse } from "../../response-dtos/get-pin-with-qr-token.response.dto";
import { GetPinWithQrTokenCommand } from "./get-pin-with-qr-token.command";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";

import { Either } from '../../../../core/types/either';
import { ErrorData } from "src/core/types";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";


@CommandHandler( GetPinWithQrTokenCommand )
export class GetPinWithQrTokenHandler implements ICommandHandler<GetPinWithQrTokenCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        
    ){}

    async execute(command: GetPinWithQrTokenCommand): Promise<Either<Error,GetPinWithQrTokenResponse>> {


        try {
            
            const searchedSession = await this.sessionRepository.findByTemporalToken( command.qrToken );
    
            if( !searchedSession )
               return Either.makeLeft( new Error(QR_TOKEN_ERRORS.QR_NOT_FOUND) );
    
            const pin = searchedSession.session.getSessionPin();
            // const sessibonId = searchedSession.session.id.value;
    
            return Either.makeRight({ sessionPin: pin });

        } catch (error) {
            
            return Either.makeLeft( error );
        }


    }


    // @Log()
    // async execute(command: GetPinWithQrTokenCommand): Promise<Either<ErrorData,GetPinWithQrTokenResponse>> {

    //     const appContext = createMultiplayerSessionAppContext('getPinWithQrToken', `QRToken Provided: ${command.qrToken}`, command.hostId );
        

    //     return pipeAsync(

            




    //     )
        
            
    //         const searchedSession = await this.sessionRepository.findByTemporalToken( command.qrToken );
    
    //         if( !searchedSession )
    //            return Either.makeLeft( new Error(QR_TOKEN_ERRORS.QR_NOT_FOUND) );
    
    //         const pin = searchedSession.session.getSessionPin();
    //         // const sessionId = searchedSession.session.id.value;
    
    //         return Either.makeRight({ sessionPin: pin });

            
    //         return Either.makeLeft( error );
        


    // }

}