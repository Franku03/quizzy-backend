import { Inject } from '@nestjs/common';
import { ICommandHandler } from 'src/core/application/cqrs';
import { CommandHandler } from 'src/core/infrastructure/cqrs';

import { InMemoryActiveSessionRepository } from 'src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository';
import type { IActiveMultiplayerSessionRepository } from 'src/multiplayer-sessions/domain/ports';
import { VerifyHostCommand } from './verify-host.command';

import { Either } from 'src/core/types';
import { COMMON_ERRORS } from '../common.errors';


@CommandHandler( VerifyHostCommand )
export class VerifyHostHandler implements ICommandHandler< VerifyHostCommand > {


    constructor(

        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

    ){}

    async execute(command: VerifyHostCommand ): Promise< void > {

        // Cargamos el agregado session desde el repositorio en memoria
        const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

        if( !sessionWrapper )
            throw new Error(COMMON_ERRORS.SESSION_NOT_FOUND);

        console.log(sessionWrapper.session.getHostId().value, command.hostId);

        if( sessionWrapper.session.getHostId().value !== command.hostId )
            throw new Error(COMMON_ERRORS.USER_NOT_AUTHORIZED);

        // La sesión efectivamente está en memoria
        return;

    }



    // async execute(command: VerifyPinCommand ): Promise< Either< Error, boolean > > {


    //     try {

    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         if( sessionWrapper.session.getHostId().value !== command.hostId )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.USER_NOT_AUTHORIZED) );


    //         // La sesión efectivamente está en memoria
    //         return Either.makeRight( true );
   
    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}
