/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\get-pin-with-qr-token\get-pin-with-qr-token.handler.ts

import { Inject } from "@nestjs/common";

import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";

import { InMemoryActiveSessionRepository  } from "src/multiplayer-sessions/infrastructure/adapters/in-memory.session.repository";

import { GetPinWithQrTokenResponse } from "../../response-dtos/get-pin-with-qr-token.response.dto";
import { GetPinWithQrTokenCommand } from "./get-pin-with-qr-token.command";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";


import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { Either } from '../../../../core/types/either';
import { ErrorData } from "src/core/types";

import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";


@CommandHandler( GetPinWithQrTokenCommand )
export class GetPinWithQrTokenHandler implements ICommandHandler<GetPinWithQrTokenCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
        
    ){}


    
    @Log()
    async execute(command: GetPinWithQrTokenCommand): Promise<Either<ErrorData,GetPinWithQrTokenResponse>> {  
        
        const appContext = createMultiplayerSessionAppContext('getPinWithQrToken', { tokenId: command.qrToken });


        return pipeAsync<ErrorData, GetPinWithQrTokenResponse>(
                    
            // 1) Metemos la materia prima (el token) en el carril derecho
            // Input: string -> Output: Either<Error, string>
            Either.makeRight( command.qrToken ),

            // 2) Buscamos usando el token
            // Recibe el string del paso anterior. Retorna Promise<Either>, así que usamos chainAsync.
            eitherToken => eitherToken.chainAsync( token => this.sessionRepository.findByTemporalTokenEither(token)),

            // 3) Extraemos lo que nos interesa (el PIN)
            // Si el repo devolvió Left (Not Found), este paso se salta automáticamente.
            ctx => ctx.map( ctx => ({ sessionPin: ctx.session.getSessionPin() }) ),

            // 4) Contexto o traducción de errores
            result => result.mapLeft( err => {
                // Se combina el contexto del error del Repositorio con el de capa de aplicación
                return err.setContext( appContext ); 
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