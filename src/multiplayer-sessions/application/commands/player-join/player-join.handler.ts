/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\player-join\player-join.handler.ts

import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";

import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { Either } from '../../../../core/types/either';

import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { IUserDao } from "src/users/application/queries/ports/users.dao.port";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import type { ISessionConcurrencyManager } from "../../ports/i-session-concurrency-manager.interface";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/adapters/in-memory.session.repository";
import { MutexSessionConcurrencyManager } from "src/multiplayer-sessions/infrastructure/adapters";

import { mapJoinToLobbyUpdate } from "../../mappers";
import { PlayerJoinCommand } from './player-join.command';
import { LobbyStateUpdateResponse } from "../../response-dtos/lobby-state-update.response.dto";

import { ErrorData } from "src/core/types";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { SessionResourcesForPlayerJoin } from "../context/session-resources.context.interface";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";


@CommandHandler( PlayerJoinCommand )
export class PlayerJoinHandler implements ICommandHandler<PlayerJoinCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( MutexSessionConcurrencyManager ) 
        private readonly concurrencyManager: ISessionConcurrencyManager,

        @Inject(DaoName.User)
        private readonly usersDao: IUserDao,

        @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) 
        private readonly logger: ILogger,
    ){}


    @Log()
    async execute(command: PlayerJoinCommand): Promise<Either<ErrorData, LobbyStateUpdateResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('playerJoin', { actorId: command.userId, sessionPin: command.sessionPin });


        return this.concurrencyManager.runInSequence( command.sessionPin, async () => {

            return pipeAsync<ErrorData, LobbyStateUpdateResponse>(
                
                // 1) Arrancamos con el command
                Either.makeRight(command),
    
                // 2) obtenemos la sesión del respositorio en memoria
                // Necesitamos la sesión Y mantenemos el comando vivo para los siguientes pasos.
                cmd => cmd.chainAsync(cmd => this.addSessionToContext(cmd)),
    
                // 3) Lógica de negocio (Buscar User + Crear Player + Unir)
                // Aquí manejamos la lógica de Invitado, Registrado, max de usuarios permitidos según usuario
                ctx => ctx.chainAsync(ctx => this.processPlayerJoin(ctx) ),
    
                // 4) Actualizar actividad de la sesión ( last activity )
                // Input: Context -> Output: Promise<Either<Error, { sessionCtx, player }>>
                ctx => ctx.chainAsync(c => this.persistState(c)),
    
                // 5) Mappear respuesta
                // Mapeamos a la respuesta que espera el Gateway
                ctx => ctx.map(c => mapJoinToLobbyUpdate(c.player, c.sessionCtx.session)),
    
                // 6) Mapeo de Errores
                result => result.mapLeft(err => err.setContext(appContext))
            );


        })

    }


    // --- MÉTODOS PRIVADOS ---

    /**
     * Busca la sesión y prepara el contexto combinado.
     */
    private async addSessionToContext(
        command: PlayerJoinCommand
    ): Promise<Either<ErrorData, SessionResourcesForPlayerJoin>> {
        // Usamos el método Either del repositorio que acabamos de crear
        const sessionResult = await this.sessionRepository.findByPinEither(command.sessionPin);

        // Si encontramos la sesión, combinamos los datos
        return sessionResult.map( sessionCtx => ({ 
                sessionCtx, 
                command 
        }));
    }

    /**
     * Resuelve la identidad (User vs Guest), crea el Player y actualiza la Session.
     */
    private async processPlayerJoin(
        ctx: SessionResourcesForPlayerJoin,
    ): Promise<Either<ErrorData, SessionResourcesForPlayerJoin>> {

        const { sessionCtx, command } = ctx;
        const { session } = sessionCtx;

        // A) Buscar usuario (Bifurcación suave)
        const userResult = await this.usersDao.getUserById(command.userId);
        const isRegistered = userResult.hasValue();

        // B) Determinar ID y Rol
        const finalId = isRegistered ? userResult.getValue().id : command.userId;
        const isGuest = !isRegistered;

        // C) Crear Factory Player
        const playerResult = PlayerFactory.createPlayerForSession(
            finalId,
            command.nickname,
            isGuest
        );

        // D) Lógica de Dominio dentro del MAP
        // Si playerResult es Left, este bloque se salta y retornamos el Left directamente.
        // Si es Right, ejecutamos la lógica y retornamos el nuevo contexto.
        return playerResult.chain( player => {
            
            
            if (session.isPlayerAlreadyJoined(player.id)) {
                
                const deleteResult = session.deletePlayer(player.id);
    
                if( deleteResult.isLeft() )
                    return Either.makeLeft( deleteResult.getLeft() );
            }

            // D) Lógica de Dominio (Reingreso)
            // Aquí se podría añadir validación para hacer return Either.makeLeft(...)
            // TODO: Devolver un error si la partida ya no permite conectar usuarios (lobby bloqueado o max jugadores plan free)

            const joinResult = session.joinPlayer(player);

            // si JoinResult es left entonces se salta este bloque y regresa el error
            // si es Right devuelve el jugador como venía en la primera llamada
            return joinResult.map( () => ({
                sessionCtx: sessionCtx,
                command: command,
                player: player
            }));

        });
    }

    /**
     * Persistencia explicita.
     * llamar a updateSession para actualizar timestamps.
     */
    private async persistState(ctx: SessionResourcesForPlayerJoin ) {

        const saveResult = await this.sessionRepository.updateSessionEither( ctx.sessionCtx.session.getSessionPin() );
        
        // Si se guarda OK, seguimos pasando los datos que necesitamos para la respuesta final
        return saveResult.map(() => ctx);
    }


    // async execute(command: PlayerJoinCommand): Promise<Either<Error, LobbyStateUpdateResponse>> {


    //     try {
    //         // Cargamos el agregado session desde el repositorio en memoria
    //         const sessionWrapper = await this.sessionRepository.findByPin( command.sessionPin );

    //         if( !sessionWrapper )
    //             return Either.makeLeft( new Error(COMMON_ERRORS.SESSION_NOT_FOUND) );

    //         const { session } = sessionWrapper



    //         // Buscamos el usuario que se quiere unir (si es que existe), de no ser asi lo unimos a la partida como invitado
    //         const result = await this.usersDao.getUserById(command.userId);
 
    //         const player = PlayerFactory.createPlayerForSession( 
    //             result.hasValue() ? result.getValue().id : command.userId, // Si no se encontro el usuario, pasamos el id que viene del JWT de invitado
    //             command.nickname, 
    //             !result.hasValue() // Si no se encontro el usuario, es un invitado
    //         );

    //         // Unimos el jugador a la partida
    //         // TODO: Devolver un error si la partida ya no permite conectar usuarios, si estamos en lobby, igual eso se hara toggle una vez empiece

    //         // Primero verificamos si ya estaba unido, de ser así borramos manualmente su anterior registro y ponemos el nuevo actualizado
    //         // Recordemos que este evento ahora se emite manualmente solo al dar nickname
    //         if( session.isPlayerAlreadyJoined( player.id ) )
    //             session.deletePlayer( player.id )

    //         session.joinPlayer( player );

    //         const res = mapJoinToLobbyUpdate( player, session );

    //         return Either.makeRight( res ); 

    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

}