import { Inject } from "@nestjs/common";
import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";

import { PlayerFactory } from "src/multiplayer-sessions/domain/factories/player.factory";

import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import { Either } from '../../../../core/types/either';

import type { ActiveSessionContext, IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";
import type { IUserDao } from "src/users/application/queries/ports/users.dao.port";

import { InMemoryActiveSessionRepository } from "src/multiplayer-sessions/infrastructure/repositories/in-memory.session.repository";

import { mapJoinToLobbyUpdate } from "../../mappers";
import { PlayerJoinCommand } from './player-join.command';
import { LobbyStateUpdateResponse } from "../../response-dtos/lobby-state-update.response.dto";
import { COMMON_ERRORS } from "../common.errors";
import { ErrorData, ErrorLayer } from "src/core/types";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { Player } from "src/multiplayer-sessions/domain/entity/session.player";


@CommandHandler( PlayerJoinCommand )
export class PlayerJoinHandler implements ICommandHandler<PlayerJoinCommand> {

    constructor(
        @Inject( InMemoryActiveSessionRepository )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject(DaoName.User) // Inyectamos el DAO usando el Token del Catálogo
        private readonly usersDao: IUserDao,
    ){}


async execute(command: PlayerJoinCommand): Promise<Either<ErrorData, LobbyStateUpdateResponse>> {

        // Contexto para logs
        const appContext = createMultiplayerSessionAppContext('playerJoin', undefined, command.userId, command.sessionPin );

        return pipeAsync<ErrorData, LobbyStateUpdateResponse>(
            
            // 1. INICIO: Arrancamos con el comando
            Either.makeRight(command),

            // 2. OBTENER SESIÓN
            // Necesitamos la sesión Y mantener el comando vivo para los siguientes pasos.
            // Input: Command -> Output: Promise<Either<Error, { sessionCtx, command }>>
            cmd => cmd.chainAsync(c => this.addSessionToContext(c)),

            // 3. LÓGICA DE NEGOCIO (Buscar User + Crear Player + Unir)
            // Aquí manejamos la lógica de "Invitado vs Registrado"
            // Input: Context -> Output: Promise<Either<Error, { sessionCtx, player }>>
            ctx => ctx.chainAsync(c => this.processPlayerJoin(c) ),

            // 4. PERSISTENCIA
            // actualizamos 'lastActivity' en el repo
            // Input: Context -> Output: Promise<Either<Error, { sessionCtx, player }>>
            ctx => ctx.chainAsync(c => this.persistState(c)),

            // 5. RESPUESTA
            // Mapeamos a la respuesta que espera el Gateway
            ctx => ctx.map(c => mapJoinToLobbyUpdate(c.player, c.sessionCtx.session)),

            // 6. MANEJO DE ERRORES
            result => result.mapLeft(err => err.setContext(appContext))
        );
    }


    // --- MÉTODOS PRIVADOS (PASOS DEL TREN) ---

    /**
     * Paso 2: Busca la sesión y prepara el contexto combinado.
     */
    private async addSessionToContext(command: PlayerJoinCommand) {
        // Usamos el método Either del repositorio que acabamos de crear
        const sessionResult = await this.sessionRepository.findByPinEither(command.sessionPin);

        // Si encontramos la sesión, combinamos los datos
        return sessionResult.map(sessionCtx => ({
            sessionCtx: sessionCtx,
            command: command
        }));
    }

    /**
     * Paso 3: Resuelve la identidad (User vs Guest), crea el Player y actualiza la Session.
     */
    private async processPlayerJoin(
        ctx: { sessionCtx: ActiveSessionContext, command: PlayerJoinCommand }
    ): Promise<Either<ErrorData,{sessionCtx: ActiveSessionContext, player: Player}>> {
        const { command, sessionCtx } = ctx;
        const { session } = sessionCtx;

        try {
            // A. Buscar usuario (Bifurcación suave)
            const userResult = await this.usersDao.getUserById(command.userId);
            const isRegistered = userResult.hasValue();

            // B. Determinar ID y Rol
            const finalId = isRegistered ? userResult.getValue().id : command.userId;
            const isGuest = !isRegistered;

            // C. Crear Factory Player
            const player = PlayerFactory.createPlayerForSession(
                finalId,
                command.nickname,
                isGuest
            );

            // D. Lógica de Dominio (Reingreso)
            // TODO: Aquí podrías añadir validación: if (!session.canJoin()) return Either.makeLeft(...)
            // TODO: Devolver un error si la partida ya no permite conectar usuarios, si estamos en lobby, igual eso se hara toggle una vez empiece

            
            if (session.isPlayerAlreadyJoined(player.id)) {
                session.deletePlayer(player.id);
            }

            session.joinPlayer(player);

            // Retornamos el contexto actualizado. 
            // Nota: sessionCtx guarda la sesión por referencia, así que ya está modificada.
            return Either.makeRight({
                sessionCtx: sessionCtx,
                player: player
            });

        } catch (error) {
            // Si falla la BD de usuarios o la lógica interna
            return Either.makeLeft( new ErrorData("Error en BD","Hubo un fallo en BD", ErrorLayer.INFRASTRUCTURE ));
        }
    }

    /**
     * Paso 4: Persistencia explicita.
     * Aunque modifiquemos la sesión en memoria, llamar a save actualiza timestamps.
     */
    private async persistState(ctx: { sessionCtx: ActiveSessionContext, player: Player }) {

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