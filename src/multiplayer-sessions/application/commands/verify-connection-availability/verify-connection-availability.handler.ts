/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\verify-connection-availability\verify-connection-availability.handler.ts

import { Inject } from '@nestjs/common';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';

import { InMemoryActiveSessionRepository } from 'src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository';
import type { IActiveMultiplayerSessionRepository } from 'src/multiplayer-sessions/domain/ports';
import { VerifyConnectionAvailabilityCommand } from './verify-connection-availability.command';

import { Either, ErrorData } from 'src/core/types';
import { COMMON_ERRORS } from '../context/errors/common.errors';
import { PlayerId } from 'src/multiplayer-sessions/domain/value-objects';

import { createMultiplayerSessionAppContext } from '../context/base-multiplayer-session-context';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';


@CommandHandler( VerifyConnectionAvailabilityCommand )
export class VerifyConnectionAvailabilityHandler implements ICommandHandler< VerifyConnectionAvailabilityCommand > {


    constructor(

        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,

    ){}

    @Log()
    async execute(command: VerifyConnectionAvailabilityCommand ): Promise< Either< ErrorData, void > >{

        const ctx = createMultiplayerSessionAppContext("verifyConnectionAvailability", { sessionPin: command.sessionPin, actorId: command.userId  });
        
        // Cargamos el agregado session desde el repositorio en memoria
        const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

        if( !sessionWrapper )
            return Either.makeLeft( DomainErrorFactory.notFound( ctx, COMMON_ERRORS.SESSION_NOT_FOUND) );

        const { session } = sessionWrapper;

        // 1) verifica si la partida esta aceptando conexiones, en lobby puede ser true o false, al empezar la partida siempre es true para permitir reconexiones
        // Esto nos permite trancar la conexion de un usuario tras poner el pin si es que no estan permitidas más conexiones, mejorando la UX
        // if( session.allowPlayerConnections() );
        //     throw new Error(COMMON_ERRORS.SESSION_NOT_ACCEPTING_CONNECTIONS);

        // 2) verifica si el usuario que intenta conectar ya pertenece a la sesion (reconexion o intento de intrusión)
        if( !session.getSessionState().isLobby() && !session.isPlayerAlreadyJoined( new PlayerId( command.userId ) ) )
            return Either.makeLeft( DomainErrorFactory.validation( ctx, { state: ["INVALID_FOR_JOINING"]} , COMMON_ERRORS.USER_NOT_IN_SESSION ) );


        return Either.makeRight( undefined );


    }

    // async execute(command: VerifyPinCommand ): Promise< Either< Error, boolean > > {


    //     try {

    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         // La sesión efectivamente está en memoria
    //         return Either.makeRight( true );
   
    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}
