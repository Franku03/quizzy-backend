/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\application\commands\create-session\create-session.handler.ts

import { Inject } from "@nestjs/common";

import { CommandHandler } from "src/core/infrastructure/cqrs";
import { ICommandHandler } from "src/core/application/cqrs";
import { CreateSessionCommand } from "./create-session.command";

import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";

import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import type { IGeneratePinService } from "src/multiplayer-sessions/domain/domain-services";
import type { IdGenerator } from "src/core/application/ports/idgenerator/i-id-generator.interface";
import type { IActiveMultiplayerSessionRepository } from "src/multiplayer-sessions/domain/ports";

import { Kahoot } from "src/kahoots/domain/aggregates/kahoot";
import { MultiplayerSessionFactory } from "src/multiplayer-sessions/domain/factories/multiplayer-session.factory";
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";


import { CreateSessionResponse } from "../../response-dtos/create-session.response.dto";
import { SessionResourcesForCreation } from "../context/session-resources.context.interface";
import { createMultiplayerSessionAppContext } from "../context/base-multiplayer-session-context";

import { IKahootOwnershipRequest, KahootOwnershipAuthorizer } from "src/core/application/aspects/auth/strategies/kahootOwnership.strategy";
import { Authorize } from "src/core/application/aspects/auth/authorization.decorator";
import { Log } from "src/core/application/aspects/logging/log.decorator";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";
import { APPLICATION_CORE_TOKENS } from "src/core/application/dependecy-tokens/application-core.tokens";

import { Either } from '../../../../core/types/either';
import { pipeAsync } from "src/core/errors/helpers/pipe-async";
import { ErrorData } from "src/core/types";



@CommandHandler( CreateSessionCommand )
export class CreateSessionHandler implements ICommandHandler<CreateSessionCommand> {

    constructor(
        @Inject( APPLICATION_CORE_TOKENS.UTILS.ACTIVE_SESSION_REPO )
        private readonly sessionRepository: IActiveMultiplayerSessionRepository,

        @Inject( RepositoryName.Kahoot )
        private readonly kahootRepository: IKahootRepository,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.ID_GENERATOR )
        private readonly idGenerator: IdGenerator<string>,

        @Inject( APPLICATION_CORE_TOKENS.UTILS.PIN_GENERATOR_SERVICE )
        private readonly sessionPinGenerator: IGeneratePinService,
    
        @Inject( APPLICATION_CORE_TOKENS.UTILS.LOGGER ) private readonly logger: ILogger,

        private readonly mediaService: MediaEnrichmentService,

    ){}



    @Log()
    @Authorize(KahootOwnershipAuthorizer, 'kahootRepository')  // Aquí cargamos el kahoot del repositorio para luego guardarlo en memoria
    async execute(
        command: CreateSessionCommand & IKahootOwnershipRequest 
    ): Promise<Either<ErrorData,CreateSessionResponse>> {

            // Creamos el id de la sesion y para que la fábrica construya el VO del id de la sesión en base al mismo
            const sessionId = this.idGenerator.generateId()  

            // Creamos el contexto de error (para saber dónde falló si algo pasa)
            const appContext = createMultiplayerSessionAppContext('createSession', { actorId: command.id, aggregateId: sessionId } );

            return pipeAsync<ErrorData, CreateSessionResponse>(
                // INICIO: Arrancamos karril con kahoot validado
                Either.makeRight(command.validatedResource as Kahoot),

                // 1) Generar Contexto
                // prepareSessionContext retorna Promise<Either>, así que usamos chainAsync
                // Input: Kahoot -> Output: Promise<Either<Error, Context>>
                k => k.chainAsync( (kahoot: Kahoot) => this.prepareSessionContext( kahoot, sessionId ) ),

                // 2) Crear Sesión (Factory)
                // createSessionWithFactory retorna un valor, así que usamos map 
                // Usamos chain porque la fábrica es síncrona, pero posee validaciones que pueden devolver error
                ctx => ctx.chain( (ctx:SessionResourcesForCreation) => this.createSessionWithFactory( ctx, command ) ),
                    
                // 3) Enriquecer (Media Service)
                // enrichSession retorna Promise<Either>, usamos chainAsync
                ctx => ctx.chainAsync(( ctx: SessionResourcesForCreation ) => this.enrichSession( ctx )),

                // 5) Registrar en Memoria (Guardar y obtener QR)
                // Input: Context -> Output: Promise<Context>
                // saveSession retorna Promise<string> (el token). Si falla, devuelve left
                ctx => ctx.chainAsync(( ctx: SessionResourcesForCreation ) => this.saveSession( ctx ) ),

                // 6) Mapeo Final (Construir respuesta)
                // Input: Context Completo -> Output: CreateSessionResponse
                ctx => ctx.map( ( ctx: SessionResourcesForCreation ) => ({
                    sessionPin: ctx.pin,
                    qrToken: ctx.qrToken,
                    quizTitle: ctx.quizTitle || 'Untitled Quiz',
                    coverImageUrl: ctx.styling?.imageId || '',
                    theme: ctx.styling?.theme || { id: '', url: '', name: '' },
                })),


                // 7) Contexto en caso de error
                // Esto intercepta cualquier Left que haya ocurrido arriba y le pega la etiqueta del contexto
                result => result.mapLeft( err => {
                    return err.setContext(appContext);
                })


            )

    }


    /**
     * Prepara los ingredientes necesarios para crear la sesión.
     * Maneja la complejidad de que generateUniquePin devuelve un Either.
     */
    private async prepareSessionContext(kahoot: Kahoot, sessionId: string ): Promise<Either<ErrorData, SessionResourcesForCreation>> {
       
        // Generamos el PIN de la partida
        const pinResult = await this.sessionPinGenerator.generateUniquePin();

        // Usamos map: Si el pin se generó bien (Right), construimos el objeto contexto.
        // Si falló (Left), el map no se ejecuta y el error se propaga automáticamente.
        return pinResult.map(pin => ({
            kahoot: kahoot,
            pin: pin,
            sessionId: sessionId
        }));
    }


    /**
     * Crea la sesión mediante su fábrica, es síncrono
     */
    private createSessionWithFactory(
        ctx: SessionResourcesForCreation, 
        command: CreateSessionCommand 
    ): Either<ErrorData, SessionResourcesForCreation> {

        const sessionResult = MultiplayerSessionFactory.createMultiplayerSession(
            ctx.kahoot,
            command.userId,
            ctx.sessionId,
            ctx.pin
        );

        return sessionResult.map( session => ({ ...ctx, session })) // Acumulamos la sesión en la bola de nieve

    }


   /**
     * Enriquece los idAssets por sus respectivos urls
     */
    private async enrichSession(
        ctx: SessionResourcesForCreation, 
    ): Promise<Either<ErrorData, SessionResourcesForCreation>> {
        const snapshot = ctx.kahoot.getSnapshot();
        const styling = await this.mediaService.enrichStyling(snapshot.styling);
        return Either.makeRight({ ...ctx, styling, quizTitle: snapshot.details?.title });
    }

  /**
     * Guardamos la session en el repositorio en memoria y obtenemos el id del token
     */
    private async saveSession(
        ctx: SessionResourcesForCreation, 
    ): Promise<Either<ErrorData, SessionResourcesForCreation>> {
        const qrToken = await this.sessionRepository.saveSessionEither({
            session: ctx.session!,
            kahoot: ctx.kahoot,
            sessionStyling: ctx.styling!
        });
        return qrToken.map( ( qrToken ) => ({ ...ctx, qrToken }) ) ;
    }

}



    // async execute(command: CreateSessionCommand): Promise<Either<Error,CreateSessionResponse>> {


    //     try {
            
    //         // Cargamos el agregado kahoot desde el repositorio

    //         const searchedKahoot = await this.kahootRepository.findKahootByIdEither( command.kahootId );


    //         if( searchedKahoot.isLeft() ){

    //             const error = searchedKahoot.getLeft();
    //             return Either.makeLeft(error);

    //         }
                    
    //         const kahoot = searchedKahoot.getRight()

    //         if( !kahoot ){

    //             const error = DomainErrorFactory.notFound(
    //                 {
    //                     domainObjectType: 'Kahoot',
    //                     domainObjectId: command.kahootId,
    //                     actorId: command.hostId,
    //                     intendedAction: 'Create multiplayer session for a Kahoot',
    //                     operation: 'CreateSessionHandler.execute',
    //                 },
    //                 CREATE_SESSION_ERRORS.KAHOOT_NOT_FOUND
    //             );

    //             return Either.makeLeft(error);

    //         }

    //         // TODO: mover esta validación aL ASPECT cuando esté implementado
    //         // Obtenemos el IDuser del host y verificamos que el kahoot le corresponda en caso de ser privado, y que el kahoot no esté en draft
    //         const hostIdString = command.hostId

    //         // Regla 1: No se puede jugar si es Draft
    //         if( kahoot.isDraft() )
    //             return Either.makeLeft( new Error(CREATE_SESSION_ERRORS.KAHOOT_IS_DRAFT) );

    //         // Regla 2: Si es privado, solo el autor puede hostearlo
    //         if( kahoot.isPrivate() && !(command.hostId === kahoot.authorId) )
    //             return Either.makeLeft( new Error(CREATE_SESSION_ERRORS.USER_UNAUTHORIZED) );

    //         // Creamos el id de la sesion y para que la fábrica construya el VO del id de la sesión en base al mismo
    //         const sessionIdString = await this.IdGenerator.generateId();

    //         // Generamos el Pin de la sesion
    //         const pin = await this.sessionPinGenerator.generateUniquePin();

    //         if( pin.isLeft() )
    //             return Either.makeLeft( new Error( pin.getLeft().message ) ); // !Parche

    //         const session = MultiplayerSessionFactory.createMultiplayerSession(
    //             kahoot,
    //             hostIdString,
    //             sessionIdString,
    //             pin.getRight(), // ! Parche
    //         )


    //         const kahootSnapshot = kahoot.getSnapshot();

    //         const enrichedSessionStyling = await this.mediaService.enrichStyling( kahootSnapshot.styling );

    //         // Guardamos la sesion en el repositorio de sesiones activas y obtenemos el token QR
    //         const qrToken = await this.sessionRepository.saveSession({
    //             session,
    //             kahoot,
    //             sessionStyling: enrichedSessionStyling
    //         });

    //         return Either.makeRight({ 
    //             sessionPin: pin.getRight(), 
    //             qrToken: qrToken,
    //             quizTitle: kahootSnapshot.details?.title || 'Untitled Quiz',
    //             coverImageUrl: enrichedSessionStyling.imageId || '',
    //             theme: enrichedSessionStyling.theme || { id: '', url: '', name: ''},
    //         }); 

    //     } catch (error) {

    //         return Either.makeLeft( error );

    //     }

    // }

