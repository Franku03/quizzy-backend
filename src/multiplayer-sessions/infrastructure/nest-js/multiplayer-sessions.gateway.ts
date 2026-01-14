/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\multiplayer-sessions.gateway.ts

import { Logger, UseFilters } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { JwtPayload } from 'src/auth/infrastructure/interfaces/jwt-payload.interface';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';
import { MultiplayerSessionsTracingService } from './multiplayer-sessions.tracing.service';

import { SessionRoles } from './enums/session-roles.enum';
import { ClientEvents, HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents } from './enums/websocket.events.enum';
import type { SessionSocket  } from './interfaces/socket-definitions.interface';


import { 
  DeleteSessionCommand,
  HostNextPhaseCommand, 
  HostStartGameCommand, 
  PlayerJoinCommand, 
  PlayerSubmitAnswerCommand, 
  SyncStateCommand, 
  VerifyConnectionAvailabilityCommand, 
  VerifyHostCommand, 
  VerifyPinCommand
} from 'src/multiplayer-sessions/application/commands';

import { 
  HostNextPhaseType, 
  HostNextPhaseResponse, 
  QuestionStartedResponse, 
  PlayerSubmitAnswerResponse,
  SyncStateResponse,

  HostLobbyUpdateResponse,
  SyncType,
  QuestionResultsHostResponse,
  QuestionResultsPlayerResponse,
  HostEndGameResponse,
  PlayerEndGameResponse,
  LobbyStateUpdateResponse,
  PlayerLobbyUpdateResponse
} from 'src/multiplayer-sessions/application/response-dtos';
import { PlayerJoinDto, PlayerSubmitAnswerDto } from './dtos';

import { Either } from 'src/core/types/either';
import { AllExceptionsFilter } from 'src/core/infrastructure/filters/all-exceptions.filter';
import { createSocketErrorPayload } from '../errors/websocket-gateway.error';
import { ErrorData } from 'src/core/types';
import { PlayerResponseData } from 'src/multiplayer-sessions/application/response-dtos/types/player-response-data.interface';
import { AuthSession } from './decorators/auth-session.decorator';


@UseFilters( AllExceptionsFilter ) // <--- Esto es lo que rompe la barrera del WsExceptionsHandler
@WebSocketGateway( 
  { namespace: 'multiplayer-sessions', cors: true }
)
export class MultiplayerSessionsGateway  implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;
    
    private readonly logger: Logger = new Logger('WebSocketGateway');
    // Maps de timers para desconexion, uno para espera de sincronizacion, otro para espera de reconexion de un host
    private readyTimeouts = new Map<string, NodeJS.Timeout>();
    private hostDisconnectionTimers = new Map<string, NodeJS.Timeout>();

    constructor(
      private readonly tracingWsService: MultiplayerSessionsTracingService,
      private readonly JwtService: JwtService,
      private readonly executor: CommandQueryExecutorService,
    ) {
      this.logger.log(`WebSocketServer running on port ${ process.env.PORT }`);
    }

    async handleConnection( client: SessionSocket ) {

      try {

        const { pin , role, jwt } = client.handshake.headers 

        let jwtPayload: JwtPayload;

        // 1) Validacion basica de tener todos los headers y que el jwt sea valido
        if( !pin || !role || !jwt )
          throw new WsException("Hacen falta datos en el header para realizar la conexión");
        
        jwtPayload = this.JwtService.verify( jwt as string ); // ? nos devuelve el payload del JWT

        // 2) Guardamos la data inmediatamente de los clientes en su propio socket
        // Hacemos esto antes de cualquier await para que se tengan los datos
        client.data.roomPin = pin as string;

        client.data.role = role as SessionRoles;

        client.data.userId = jwtPayload.id as string; 
        
        // 3) Validaciones de Dominio (Asíncronas)
        await this.executor.executeCommand( new VerifyPinCommand( pin as string, jwtPayload.id ) );

        if ( role === SessionRoles.HOST ) {

            await this.executor.executeCommand( new VerifyHostCommand( pin as string, jwtPayload.id as string ) );

            this.tracingWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo
              
        } else if( role === SessionRoles.PLAYER ){
  
          await this.executor.executeCommand( new VerifyConnectionAvailabilityCommand( pin as string, jwtPayload.id as string ) );
            
        } else {
  
          client.disconnect(true); // En caso de no ser ninguno de esos roles, hacemos desconexión inmediatamente
  
        }

        // 4) Gestionamos la union a la sala y al logger
        await client.join( pin as string );

        this.logger.log(`Socket [${client.id}: ${ client.data.role }] validado y unido a sala ${pin}. Esperando CLIENT_READY.`);   

        // 5) dejamos en espera la confirmación de sincronización
        const confirmationTime = Number(process.env.CLIENT_CONFIRMATION_TIME) || 60000; // 1 min default

        const timeout = setTimeout(() => {
          if (this.readyTimeouts.has(client.id)) {
            this.logger.warn(`Socket ${client.id} nunca envió CLIENT_READY. Desconectando...`);
            client.disconnect(true);
            this.readyTimeouts.delete(client.id);
          }
        }, confirmationTime ); 

        this.readyTimeouts.set(client.id, timeout);

      } catch (error) {

        // Emitimos error al cliente
        client.emit( ServerErrorEvents.CONNECTION_ERROR, createSocketErrorPayload( error, ServerErrorEvents.CONNECTION_ERROR ));
        
        // Logeamos error detallado para el servidor
        this.printGatewayError( error, `Fallo en la conexión del cliente ${client.id}:` );

        // Terminar la conexión para el cliente defectuoso
        client.disconnect(true);

        // Loggeamos desconexión para el servidor
        this.logger.error(`Cliente [${client.id}: ${ client.data.role }] desconectado después de error.`);

      }
    }

    async handleDisconnect( client: SessionSocket ) {

      const { roomPin, role, userId, nickname } = client.data;

      // Verificamos por si el usuario tiene algun timeout aun en memoria esperándolo, se pudo haber desconectado antes de hacer client_ready
      const pendingReadyTimeout = this.readyTimeouts.get(client.id);

      if (pendingReadyTimeout) {
        clearTimeout(pendingReadyTimeout);
        this.readyTimeouts.delete(client.id);
        this.logger.debug(`Limpiado readyTimeout para socket ${client.id} por desconexión temprana.`);
      }

      // Aseguramos que la sala exista para evitar emitir eventos que no tocan o remover cosas del servicio de traza en momentos de cierre de sesión
      const roomExists = roomPin && this.tracingWsService.roomExist( roomPin );
      const isHostInRoom = this.tracingWsService.roomHasHost( roomPin );
      const isValidHostDisconnectionNotification = role === SessionRoles.HOST && roomExists && isHostInRoom;

      // * Desconexión de Host
      // se enciende el periodo de gracia para cerrar sala y desconectar jugadores
      if ( isValidHostDisconnectionNotification ) {

        this.logger.warn(`Host se desconectó de la sala ${roomPin}. Iniciando periodo de gracia esperando de reconexion`);

        // Notificamos a los jugadores
        this.wss.to( roomPin ).emit( ServerEvents.HOST_LEFT_SESSION, { message: "El host ha abandonado la sesión por favor espere" } );

        const gracePeriod = Number(process.env.GRACE_PERIOD_TIME) || 120000; // 2 min default

        // Empezamos el timeout de espera del host, si no vuelve cerramos la sesión por completo
        const timeout = setTimeout(async () => {

          this.logger.error(`El tiempo de espera de reconexión expiró para sala ${roomPin}. Cerrando partida.`);
          
          await this.closeSession( roomPin );

          this.hostDisconnectionTimers.delete(roomPin);

        }, gracePeriod ); 

        this.hostDisconnectionTimers.set(roomPin, timeout);
        
      }

      // * Desconexión de jugador
      // solo hacemos esta notificacion en caso de que el jugador ya haya confirmado que esta sincronizado,
      // ue tenga nickname registrado (hizo player_join) y la sala exista
      const validPlayerDisconnectionToNotify = role === SessionRoles.PLAYER && !this.readyTimeouts.has( client.id ) && nickname && roomExists

      if ( validPlayerDisconnectionToNotify ) {

        // Notificamos al host
        const hostSocketId = this.tracingWsService.getRoomHostSocketId( roomPin ); 


        if( hostSocketId ){

          // Busca una sala llamada como el id del socket, en Socket.IO cada socket se une automáticamente a una sala con su propio ID
          const clients = await this.wss.in( hostSocketId ).fetchSockets();
          const hostClient = clients[0]; // Como el ID es único, solo vendrá uno
          
          hostClient?.emit(ServerEvents.PLAYER_LEFT_SESSION, { 
            userId: userId,
            nickname: nickname,
            message: `El jugador ${nickname} se ha desconectado.`
          });
          
          this.logger.debug(`Jugador [${nickname}, ${userId}] salió de sala ${roomPin}. Host notificado.`);

        }

      }

      // * Limpieza de logs si la sala existe en el registro
      if (roomExists) {
          try {
            if( role === SessionRoles.HOST ){
              this.tracingWsService.removeHost( roomPin );
            }else{
              this.tracingWsService.removeClient( roomPin, client.id );
            }
          } catch (error) {
            this.logger.warn(`Error al remover cliente [${client.id}: ${ client.data.role }]: ${error.message}`);
          }
      }


      this.logger.log(`Cliente Desconectado: [${client.id}: ${ client.data.role }]`);
      this.tracingWsService.logConnectedClients(); // Imprimimos de nuevo el loggin en memoria

    }

    // --------------------------------------------------------------------------
    // * Evento para disparar la lógica de negocios y la sincronización con la sessión 
    // --------------------------------------------------------------------------
    @AuthSession( SessionRoles.HOST, SessionRoles.PLAYER )
    @SubscribeMessage(ClientEvents.CLIENT_READY) // Definir 'client_ready' en tus constantes
    async handleClientReady(client: SessionSocket) {

      this.logger.debug(`Recibido CLIENT_READY de ${client.data.role} (${client.id})`);

      // Limpiamos el timeout porque el cliente ya cumplió y notificó de que está listo para sincronizar
      const timeout = this.readyTimeouts.get(client.id);
      if (timeout) {
        clearTimeout(timeout);
        this.readyTimeouts.delete(client.id);
      }

      // Para cuando se reconecte un host que estaba desconectado
      if (client.data.role === SessionRoles.HOST) {
        const pendingTimer = this.hostDisconnectionTimers.get(client.data.roomPin);
        if (pendingTimer) {

          this.logger.log(`Host reconectado a sala ${client.data.roomPin}. Cancelando cierre de sala.`);
          clearTimeout(pendingTimer);
          this.hostDisconnectionTimers.delete(client.data.roomPin);
          //Notificamos a los jugadores
          this.wss.to( client.data.roomPin ).emit( ServerEvents.HOST_RETURNED_TO_SESSION, { message: "El host ha recuperado la conexión con la sesión" } );

        }
      }

      // Llamamos a la sincronización ahora que el cliente nos confirma que está escuchando
      const syncResult = await this.syncClientState(client);

      if (syncResult.isLeft()) {

        const error = syncResult.getLeft();

        this.printGatewayError( error, `Error en sincronización post-ready: ${error.message}` );

        client.emit(ServerErrorEvents.SYNC_ERROR, createSocketErrorPayload( error, ServerErrorEvents.SYNC_ERROR ) );

        client.disconnect(true);

        return;

      }

      // Una vez sincronizado con éxito, lo registramos oficialmente en la traza/juego
      this.tracingWsService.registerClient(client);

      if (client.data.role === SessionRoles.HOST)  this.tracingWsService.logConnectedClients(); // Si es host imprimos en consola 

    }


    // --------------------------------------------------------------------------
    // * Evento emitidos por el PLAYER
    // --------------------------------------------------------------------------
    @AuthSession( SessionRoles.PLAYER )
    @SubscribeMessage( PlayerUserEvents.PLAYER_JOIN )
    async handlePlayerJoin( client: SessionSocket, payload: PlayerJoinDto ){

        const result = await this.executor
                 .executeCommand<LobbyStateUpdateResponse>( new PlayerJoinCommand( client.data.userId, payload.nickname, client.data.roomPin ) );


        // Guardamos el nickname registrado en el dominio en el socket para futuros usos
        client.data.nickname = result.playerLobbyUpdate.nickname;
        client.emit(ServerEvents.PLAYER_CONNECTED_TO_SESSION, result.playerLobbyUpdate );

        // Emitimos la respuesta de actualización de lobby solo al Host
        await this.handleRoomHostNotification( client.data.roomPin, result.hostLobbyUpdate, ServerEvents.HOST_LOBBY_UPDATE );

        // actualizamos la info del nuevo jugador registrado en el servicio de tracing          
        this.tracingWsService.registerClientNickname( client );
        this.tracingWsService.logConnectedClients(); // Registramos en logging en memoria


    }


    @AuthSession( SessionRoles.PLAYER )
    @SubscribeMessage( PlayerUserEvents.PLAYER_SUBMIT_ANSWER )
    async handlePlayerSubmitAnswer( client: SessionSocket, payload: PlayerSubmitAnswerDto ){

        const res = 
          await this.executor.executeCommand<PlayerSubmitAnswerResponse>( new PlayerSubmitAnswerCommand( 
              payload.questionId,
              payload.answerId,
              payload.timeElapsedMs,
              client.data.roomPin,
              client.data.userId
          ));


          client.emit( ServerEvents.PLAYER_ANSWER_CONFIRMATION, { status: 'ANSWER SUCCESFULLY SUBMITTED' });

          // Emitimos la respuesta de actualización de lobby solo al Host
          await this.handleRoomHostNotification( client.data.roomPin, res, ServerEvents.HOST_ANSWERS_UPDATE );

    }

    // --------------------------------------------------------------------------
    // * Evento emitidos por el HOST
    // --------------------------------------------------------------------------
    @AuthSession( SessionRoles.HOST )
    @SubscribeMessage( HostUserEvents.HOST_START_GAME )
    async handleHostStartGame( client: SessionSocket ){

        const res =
                  await this.executor.executeCommand<QuestionStartedResponse>( new HostStartGameCommand( client.data.roomPin ) );

        this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.data );

    }

    @AuthSession( SessionRoles.HOST )
    @SubscribeMessage( HostUserEvents.HOST_NEXT_PHASE )
    async handleHostNextPhase( client: SessionSocket ){

      const res =
              await this.executor.executeCommand<HostNextPhaseResponse>( new HostNextPhaseCommand( client.data.roomPin ) );


      switch( res.type ){

        case HostNextPhaseType.QUESTION_STARTED:

          this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.data );
          break;  

        case HostNextPhaseType.QUESTION_RESULTS:{

            // Emitimos payload al Host
            client.emit( ServerEvents.HOST_RESULTS, res.hostData);

            // Emitimos la respuesta particular a cada Player
            await this.handleNotifyAllPlayersInRoom( client.data.roomPin, res.playerData, ServerEvents.PLAYER_RESULTS);

            break;
        }

        case HostNextPhaseType.GAME_END:{
            // Si llegamos aquí, GARANTIZAMOS que está en la BD.  
            // Emitimos payload al Host
            client.emit( ServerEvents.HOST_GAME_END, res.hostData );
            // Emitimos la respuesta particular a cada Player
            await this.handleNotifyAllPlayersInRoom( client.data.roomPin, res.playerData, ServerEvents.PLAYER_GAME_END);

            break;

        }
          
      }

    }

    @AuthSession( SessionRoles.HOST )
    @SubscribeMessage( HostUserEvents.HOST_END_SESSION )
    async handleHostEndSession( client: SessionSocket ){

        const roomPin = client.data.roomPin;

        if (!roomPin) return;
        
        await this.closeSession( roomPin );

    
    }

    // --------------------------------------------------------------------------
    // * Método privado para gestionar cierres de sesión de manera segura o procedimientos de envio de eventos
    // --------------------------------------------------------------------------
    private async closeSession( roomPin: string ){

        this.logger.log(`Host cerrando sesión y desconectando sala: ${roomPin}`);

        // 2) NOTIFICACIÓN FINAL (Graceful Shutdown)
        // Antes de cortar el cable, avisamos a los clientes para que el Frontend sepa que fue un cierre intencional y no un error de red.
        // Así evitamos que el cliente intente reconectarse automáticamente.
        this.wss.to(roomPin).emit(ServerEvents.SESSION_CLOSED, {
            reason: ServerEvents.SESSION_CLOSED,
            message:'El anfitrión ha finalizado la sesión.',
        });

        // 3) LIMPIAR INFORMACIÓN DE LA SALA EN MEMORIA
        // Limpiamos la sala del servicio de traza, necesario para evitar emitir evento de host abandonó la sesión
        this.tracingWsService.removeRoom( roomPin );

        // 4) DESCONEXIÓN DE LA SALA
        // Esto desconecta a TODOS los sockets en esa sala (Host incluido)
        // El argumento 'true' fuerza el cierre del nivel bajo.
        await this.wss.in(roomPin).disconnectSockets(true);
        
        // 5) LIMPIEZA ADICIONAL
        // Revisamos si la sesión quedo en memoria tras acabar la sesión pues este cierre pudo darse por una desconexión, lo que puede implicar un leak de memoria
        const res = await this.executor.executeCommand<boolean>( new DeleteSessionCommand( roomPin ) );

        if( res )
            this.logger.log(`Session con pin: ${ roomPin }, ELIMINADA exitosamente`)

        this.logger.log(`Sala con pin: ${ roomPin }, CERRADA exitosamente el ${ new Date().toString() }`);

    }

    // --------------------------------------------------------------------------
    // * Método privado para notificar al host de una sala desde un evento que envia respuesta al jugador
    // --------------------------------------------------------------------------
    private async handleRoomHostNotification<T>( roomPin: string, response: T, event: ServerEvents ): Promise<void> {

      // Notificamos al host
      const hostSocketId = this.tracingWsService.getRoomHostSocketId( roomPin );

      if( hostSocketId ){

        // Busca una sala llamada como el id del socket, en Socket.IO cada socket se une automáticamente a una sala con su propio ID
        const clients = await this.wss.in( hostSocketId ).fetchSockets();
        const hostClient = clients[0]; // Como el ID es único, solo vendrá uno

        hostClient.emit( event , response );

      }
      
      return

    }

    // --------------------------------------------------------------------------
    // * Método privado para enviar la respuesta específica a cada jugador conectado a una sala
    // --------------------------------------------------------------------------
    private async handleNotifyAllPlayersInRoom<T extends PlayerResponseData >( 
      roomPin: string, 
      playerData: Map<string, T>, 
      event: ServerEvents 
    ): Promise<void> {

      // Notificamos a todos los jugadores de una sala
      const sockets = await this.wss.in( roomPin ).fetchSockets();
      for (const socket of sockets) {
          if ( socket.data.role === SessionRoles.PLAYER ) {
              socket.emit( event, playerData.get( socket.data.userId ));
          }
      }
      
      return

    }
    // --------------------------------------------------------------------------
    // * Método privado para la sincronización del cliente al emitir client_ready
    // --------------------------------------------------------------------------
    private async syncClientState( client: SessionSocket ): Promise<Either<Error, void>> {

      const result = 
        await this.executor.executeCommand<SyncStateResponse>( new SyncStateCommand( client.data.roomPin , client.data.userId ) );

        switch( result.type ){

          case( SyncType.HOST_LOBBY_UPDATE ): {

            if( this.tracingWsService.roomHasHost( client.data.roomPin ) )
                return Either.makeLeft( new WsException("Ya hay un host conectado a la partida") );

            client.emit( ServerEvents.HOST_CONNECTED_SUCCESS, { status: 'IN_LOBBY - CONNECTED TO SERVER' });
            client.emit( ServerEvents.HOST_LOBBY_UPDATE, result.data as HostLobbyUpdateResponse);
            break;


          }
          case( SyncType.PLAYER_LOBBY_STATE_UPDATE ): {

            if( result.additionalData ){

              // Si no nos llego la data adicional quiere decir que a penas el jugador esta haciendo client_ready por primera vez, le enviamos el fondo de la partida
              client.emit( ServerEvents.PLAYER_CONNECTED_TO_SERVER , { status: 'IN_LOBBY - CONNECTED TO SERVER', theme: result.theme! });

            } else {

              const { hostLobbyUpdate, playerLobbyUpdate } = result.data as LobbyStateUpdateResponse;

              // Se le vuelve a reasignar el nickname al socket
              client.data.nickname = playerLobbyUpdate.nickname;

              // Marcamos que el usuario ya estaba conectado de antes en la partida
              playerLobbyUpdate.connectedBefore = true;
              client.emit(ServerEvents.PLAYER_CONNECTED_TO_SESSION, { ...playerLobbyUpdate, theme: result.theme } as PlayerLobbyUpdateResponse );

              // registramos de nuevo su nombre en el servicio de traza       
              this.tracingWsService.registerClientNickname( client );
          
              // Notificamos al host
              await this.handleRoomHostNotification( client.data.roomPin, hostLobbyUpdate, ServerEvents.HOST_LOBBY_UPDATE);

              this.tracingWsService.logConnectedClients(); // Imprimimos en consola para dejar constancia del regreso

            }
          }

          case( SyncType.HOST_RESULTS ):
            client.emit( ServerEvents.HOST_RESULTS, result.data as QuestionResultsHostResponse );
            break;

          case( SyncType.PLAYER_RESULTS ):
            client.emit( ServerEvents.PLAYER_RESULTS, {...result.data, theme: result.theme } as QuestionResultsPlayerResponse );
            break;

          case( SyncType.QUESTION_STARTED ):
            client.emit( ServerEvents.QUESTION_STARTED, { ...result.data, ...result.additionalData, theme: result.theme } as QuestionStartedResponse );
            break;

          case( SyncType.HOST_END_GAME ):
            client.emit( ServerEvents.HOST_GAME_END, result.data as HostEndGameResponse );
            break;                

          case( SyncType.PLAYER_END_GAME ):
            client.emit( ServerEvents.PLAYER_GAME_END, { ...result.data, theme: result.theme } as PlayerEndGameResponse );
            break;


        }

        return Either.makeRight( undefined );

    }
    



    // --------------------------------------------------------------------------
    // * Método privado imprimir errores tipo ErrorData capturados fuera del ExceptionFilter en consola
    // --------------------------------------------------------------------------
    private printGatewayError(error: unknown, prelogMessage: string ): void {

        if( error instanceof ErrorData ){

          this.logger.error( prelogMessage );

          this.logger.error(error.toLogString());

          return;
        }

        this.logger.error( error );

    }


}
