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

import { InMemoryActiveSessionRepository } from 'src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository';
import type { IActiveMultiplayerSessionRepository } from 'src/multiplayer-sessions/domain/ports';
import { VerifyPinCommand } from './verify-pin.command';

import { Either } from 'src/core/types';
import { COMMON_ERRORS } from '../common.errors';


@CommandHandler( VerifyPinCommand )
export class VerifyPinHandler implements ICommandHandler< VerifyPinCommand > {


    constructor(

        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

    ){}

    async execute(command: VerifyPinCommand ): Promise< void > {

        // Cargamos el agregado session desde el repositorio en memoria
        const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

        if( !sessionWrapper )
            throw new Error(COMMON_ERRORS.SESSION_NOT_FOUND);

        // La sesión efectivamente está en memoria
        return;

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