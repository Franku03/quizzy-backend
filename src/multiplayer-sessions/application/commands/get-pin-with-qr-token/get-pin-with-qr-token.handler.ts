
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


    
    @Log()
    async execute(command: GetPinWithQrTokenCommand): Promise<Either<ErrorData,GetPinWithQrTokenResponse>> {        

        return pipeAsync<ErrorData, GetPinWithQrTokenResponse>(
                    
            // 1) EL INICIO: Metemos la materia prima (el token) en el riel derecho
            // Input: string -> Output: Either<Error, string>
            Either.makeRight( command.qrToken ),

            // 2) REPOSITORIO: Buscamos usando el token
            // Recibe el string del paso anterior. Retorna Promise<Either>, así que usamos chainAsync.
            // Input: string -> Output: Promise<Either<Error, ActiveSessionContext>>
            eitherToken => eitherToken.chainAsync( token => this.sessionRepository.findByTemporalTokenEither(token)),

            // 3) MAPEO: Extraemos lo que nos interesa (el PIN)
            // Si el repo devolvió Left (Not Found), este paso se salta automáticamente.
            // Input: Wrapper -> Output: GetPinWithQrTokenResponse
            ctx => ctx.map( ctx => ({ sessionPin: ctx.session.getSessionPin() }) ),

            // 4) Contexto o traducción de errores
     
            result => result.mapLeft( err => {
                // Se combina el contexto del error del Repositorio con el de capa de aplicación
                return err 
            })
                    
        )


    }


    // async execute(command: GetPinWithQrTokenCommand): Promise<Either<Error,GetPinWithQrTokenResponse>> {


    //     try {
            
    //         const searchedSession = await this.sessionRepository.findByTemporalToken( command.qrToken );
    
    //         if( !searchedSession )
    //            return Either.makeLeft( new Error(QR_TOKEN_ERRORS.QR_NOT_FOUND) );
    
    //         const pin = searchedSession.session.getSessionPin();
    //         // const sessibonId = searchedSession.session.id.value;
    
    //         return Either.makeRight({ sessionPin: pin });

    //     } catch (error) {
            
    //         return Either.makeLeft( error );
    //     }


    // }

}