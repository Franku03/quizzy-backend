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

import { Either } from 'src/core/types';
import { COMMON_ERRORS } from '../common.errors';
import { PlayerId } from 'src/multiplayer-sessions/domain/value-objects';


@CommandHandler( VerifyConnectionAvailabilityCommand )
export class VerifyConnectionAvailabilityHandler implements ICommandHandler< VerifyConnectionAvailabilityCommand > {


    constructor(

        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

    ){}

    async execute(command: VerifyConnectionAvailabilityCommand ): Promise< void > {

        try {
            
            // Cargamos el agregado session desde el repositorio en memoria
            const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );
    
            if( !sessionWrapper )
                throw new Error(COMMON_ERRORS.SESSION_NOT_FOUND);
    
            const { session } = sessionWrapper;
    
            // 1) verifica si la partida esta aceptando conexiones, en lobby puede ser true o false, al empezar la partida siempre es true para permitir reconexiones
            // Esto nos permite trancar la conexion de un usuario tras poner el pin si es que no estan permitidas más conexiones, mejorando la UX
            // if( session.allowPlayerConnections() );
            //     throw new Error(COMMON_ERRORS.SESSION_NOT_ACCEPTING_CONNECTIONS);

            // 2) verifica si el usuario que intenta conectar ya pertenece a la sesion (reconexion o intento de intrusión)
            if( !session.getSessionState().isLobby() && !session.isPlayerAlreadyJoined( new PlayerId( command.userId ) ) )
                throw new Error(COMMON_ERRORS.USER_NOT_IN_SESSION);

            return;

        } catch (error) {
            return Promise.reject(error);
        }


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
