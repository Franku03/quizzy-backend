/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\verify-pin\verify-pin.handler.ts

import { Inject } from '@nestjs/common';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';

import { InMemoryActiveSessionRepository } from 'src/multiplayer-sessions/infrastructure/adapters/in-memory.session.repository';
import type { IActiveMultiplayerSessionRepository } from 'src/multiplayer-sessions/domain/ports';
import { VerifyPinCommand } from './verify-pin.command';

import { Either, ErrorData } from 'src/core/types';
import { COMMON_ERRORS } from '../context/errors/common.errors';
import { createMultiplayerSessionAppContext } from '../context/base-multiplayer-session-context';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';


@CommandHandler( VerifyPinCommand )
export class VerifyPinHandler implements ICommandHandler< VerifyPinCommand > {


    constructor(

        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,


        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,

    ){}

    @Log()
    async execute(command: VerifyPinCommand ): Promise< Either< ErrorData, void > > {

        const ctx = createMultiplayerSessionAppContext("verifyPin", { sessionPin: command.sessionPin, actorId: command.userId  });

        // Cargamos el agregado session desde el repositorio en memoria
        const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

        if( !sessionWrapper )
            return Either.makeLeft( DomainErrorFactory.notFound( ctx, COMMON_ERRORS.SESSION_NOT_FOUND) );

        // La sesión efectivamente está en memoria
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