import { BadRequestException, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { CommandBus } from 'src/core/infrastructure/cqrs';
import { MultiplayerSessionsTracingService } from './multiplayer-sessions.tracing.service';

import { SessionRoles } from './enums/session-roles.enum';
import { ClientEvents, HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents } from './enums/websocket.events.enum';
import type { SessionSocket  } from './interfaces/socket-definitions.interface';


import { 
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
  GameStateUpdateResponse, 
  HostNextPhaseResponse, 
  QuestionStartedResponse, 
  PlayerSubmitAnswerResponse,
  SyncStateResponse,

  HostLobbyUpdateResponse,
  PlayerStateUpdateResponse,
  SyncType,
  QuestionResultsHostResponse,
  QuestionResultsPlayerResponse,
  HostEndGameResponse,
  PlayerEndGameResponse
} from 'src/multiplayer-sessions/application/response-dtos';
import { PlayerJoinDto, PlayerSubmitAnswerDto } from './dtos';


import { COMMON_ERRORS } from 'src/multiplayer-sessions/application/commands/common.errors';

import { Either } from 'src/core/types/either';
import { mapPayloadToPlayer } from 'src/multiplayer-sessions/application/helpers/map-payload-to-player.helper';



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
      private readonly commandBus: CommandBus,
    ) {
      this.logger.log(`WebSocketServer running on port ${ process.env.PORT }`);
    }

    async handleConnection( client: SessionSocket ) {

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT

      const { pin , role, jwt } = client.handshake.headers 

      try {

        // 1) Validacion basica de tener todos los headers
        if( !pin || !role || !jwt )
          throw new WsException("Hacen falta datos en el header para realizar la conexión");
        

       // 2) Guardamos la data inmediatamente de los clientes en su propio socket
       // Hacemos esto antes de cualquier await para que se tengan los datos
        client.data.roomPin = pin as string;

        client.data.role = role as SessionRoles;

        client.data.userId = jwt as string; // TODO: Cuando lo podamos obtener con el JWT realmente adjuntaremos aqui el UserID obtenido mediante el mismo

        // 3) Validaciones de Dominio (Asíncronas)
        // TODO: Verificar uso del Either cuando haya refactoring de errores
        await this.commandBus.execute( new VerifyPinCommand( pin as string ) );

        if ( role === SessionRoles.HOST ) {

            // TODO: Verificar uso del Either cuando haya refactoring de errores
            await this.commandBus.execute( new VerifyHostCommand( pin as string, jwt as string ) );

            this.tracingWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo
              
        } else if( role === SessionRoles.PLAYER ){
  
          // TODO: Verificar uso del Either cuando haya refactoring de errores
          await this.commandBus.execute( new VerifyConnectionAvailabilityCommand( pin as string, jwt as string ) );
            
        } else {
  
          client.disconnect(true); // En caso de no ser ninguno de esos roles, o que ya haya un desconecto inmediatamente
  
        }


        // 4) Gestionamos la union a la sala y al logger
        await client.join( pin as string );

        this.logger.log(`Socket [${client.id}: ${ client.data.role }] validado y unido a sala ${pin}. Esperando CLIENT_READY.`);   


        // 5) dejamos en espera la confirmación de sincronización
        const timeout = setTimeout(() => {
          if (this.readyTimeouts.has(client.id)) {
            this.logger.warn(`Socket ${client.id} nunca envió CLIENT_READY. Desconectando...`);
            client.disconnect(true);
            this.readyTimeouts.delete(client.id);
          }
        }, 60000); 

        this.readyTimeouts.set(client.id, timeout);

      } catch (error) {
        
        // Loggea el error para el servidor
        this.logger.error(`Fallo en la conexión del cliente ${client.id}:`, error);

        let errorMessage = 'Error desconocido en el servidor.';
        
        // Determinar el mensaje de error para el cliente
        if (error instanceof WsException) {
            // Si es una WsException, extrae el mensaje de error para el cliente.
            // Si WsException se envuelve con otro error, usa error.message
            errorMessage = error.message; 

        } else if (error instanceof Error) {

            // Manejar otros errores 
            errorMessage = error.message;

        }

        // Notificar al cliente (importante: usa un evento conocido)
        client.emit( ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400, // Usaremos equivalentes a los codigos HTTP
            message: `WS Bad Request: ${errorMessage}`
        });
        
        // Terminar la conexión para el cliente defectuoso
        // Retrasar la desconexión para permitir el envío del evento 
        client.disconnect(true);
        this.logger.log(`Cliente [${client.id}: ${ client.data.role }] desconectado después de error.`);

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

      // Desconexión de Host
      if (role === SessionRoles.HOST) {

        this.logger.log(`Host se desconectó de la sala ${roomPin}. Iniciando periodo de gracia de`);
        
        const gracePeriod = Number(process.env.GRACE_PERIOD_TIME) || 120000; // 2 min default

        // Empezamos el timeout de espera del host, si no vuelve cerramos la sesión por completo
        const timeout = setTimeout(async () => {

          this.logger.error(`El tiempo de espera de reconexión expiró para sala ${roomPin}. Cerrando partida.`);
          
          await this.closeSession( roomPin );

          this.hostDisconnectionTimers.delete(roomPin);

        }, gracePeriod ); 

        this.hostDisconnectionTimers.set(roomPin, timeout);
        
      }


      // Desconexión de jugador
      // solo hacemos esta notificacion en caso de que el jugador ya haya confirmado que esta sincronizado y que tenga nickname registrado (hizo player_join)
      if (role === SessionRoles.PLAYER && !this.readyTimeouts.has( client.id ) && nickname ) {
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

      this.logger.log(`Cliente Desconectado: [${client.id}: ${ client.data.role }]`);

      if (roomPin) {
          try {
            this.tracingWsService.removeClient(roomPin, client.id);
          } catch (error) {
            this.logger.warn(`Error al remover cliente [${client.id}: ${ client.data.role }]: ${error.message}`);
          }
      }
      
    }


    private async syncClientState( client: SessionSocket ): Promise<Either<Error, void>> {
        try {

            const res: Either<Error, SyncStateResponse >
             = await this.commandBus.execute( new SyncStateCommand( client.data.roomPin , client.data.userId ) );

            if( res.isLeft() ){

              return Either.makeLeft( res.getLeft() );

            } else {

              const result = res.getRight();

              switch( result.type ){

                case( SyncType.HOST_LOBBY_UPDATE ):

                  if( this.tracingWsService.roomHasHost( client.data.roomPin ) )
                      throw new WsException("Ya hay un host conectado a la partida");

                  client.emit( ServerEvents.HOST_CONNECTED_SUCCESS, { status: 'IN_LOBBY - CONNECTED TO SERVER' });
                  client.emit(ServerEvents.HOST_LOBBY_UPDATE, result.data as HostLobbyUpdateResponse);
                  break;

                case( SyncType.PLAYER_STATE_UPDATE ): {

                  if( result.additionalData ){
                    client.emit( ServerEvents.PLAYER_CONNECTED_TO_SERVER , { status: 'IN_LOBBY - CONNECTED TO SERVER' });
                  } else {

                    const { hostLobbyUpdate, playerStateUpdate } = result.data as GameStateUpdateResponse;

                    // Se le vuelve a reasignar el nickname al socket
                    client.data.nickname = playerStateUpdate.nickname;
                    client.emit(ServerEvents.PLAYER_CONNECTED_TO_SESSION, playerStateUpdate as PlayerStateUpdateResponse );

               
                     // Notificamos al host
                    const hostSocketId = this.tracingWsService.getRoomHostSocketId( client.data.roomPin ); 
                    if( hostSocketId ){

                      // Busca una sala llamada como el id del socket, en Socket.IO cada socket se une automáticamente a una sala con su propio ID
                      const clients = await this.wss.in( hostSocketId ).fetchSockets();
                      const hostClient = clients[0]; // Como el ID es único, solo vendrá uno

                      hostClient.emit(ServerEvents.HOST_LOBBY_UPDATE, hostLobbyUpdate as HostLobbyUpdateResponse);

                    }
                    break;

                  }
                }

                case( SyncType.HOST_RESULTS ):
                  client.emit( ServerEvents.HOST_RESULTS, result.data as QuestionResultsHostResponse );
                  break;

                case( SyncType.PLAYER_RESULTS ):
                  client.emit( ServerEvents.PLAYER_RESULTS, result.data as QuestionResultsPlayerResponse );
                  break;

                case( SyncType.QUESTION_STARTED ):
                  client.emit( ServerEvents.QUESTION_STARTED, { ...result.data, ...result.additionalData } as QuestionStartedResponse );
                  break;

                case( SyncType.HOST_END_GAME ):
                  client.emit( ServerEvents.HOST_GAME_END, result.data as HostEndGameResponse );
                  break;                

                case( SyncType.PLAYER_END_GAME ):
                  client.emit( ServerEvents.PLAYER_GAME_END, result.data as PlayerEndGameResponse );
                  break;


              }

              return Either.makeRight( undefined );

            }
              

        } catch (error) {
            // Capturamos cualquier error inesperado en el caso de uso
            this.logger.error(`Error crítico al intentar sincronizar al usuario: ${error}`);
            return Either.makeLeft(error instanceof Error ? error : new Error(String(error)));
        }
    }
    

    // --------------------------------------------------------------------------
    // * Evento para disparar la lógica de negocios y la sincronización con la sessión 
    // --------------------------------------------------------------------------
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
        }
      }

      // Llamamos a la sincronización ahora que el cliente nos confirma que está escuchando
      const syncResult = await this.syncClientState(client);

      if (syncResult.isLeft()) {
        const error = syncResult.getLeft();
        this.logger.error(`Error en sincronización post-ready: ${error.message}`);
        
        client.emit(ServerErrorEvents.SYNC_ERROR, { statusCode: 500, message: error.message });
        client.disconnect(true);
        return;
      }

      // Una vez sincronizado con éxito, lo registramos oficialmente en la traza/juego
      this.tracingWsService.registerClient(client);
    }


    // --------------------------------------------------------------------------
    // * Evento emitidos por el PLAYER
    // --------------------------------------------------------------------------
    @SubscribeMessage( PlayerUserEvents.PLAYER_JOIN )
    async handlePlayerJoin( client: SessionSocket, payload: PlayerJoinDto ){
      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        if( !client.rooms.has( client.data.roomPin ))
          this.handleError( client, new Error("FATAL: El cliente no se encuentra conectado a la sala solicitada"));

        if( client.data.role !== SessionRoles.PLAYER )
          this.handleError( client, new Error("El Host de la partida no puede unrise a la sesion de juego"));

        const res: Either<Error, GameStateUpdateResponse> = 
          await this.commandBus.execute( new PlayerJoinCommand( client.data.userId, payload.nickname, client.data.roomPin ) );

        if( res.isRight() ){

          const result = res.getRight();

          // Guardamos el nickname registrado en el dominio en el socket para futuros usos
          client.data.nickname = result.playerStateUpdate.nickname;
          client.emit(ServerEvents.PLAYER_CONNECTED_TO_SESSION, result.playerStateUpdate );

          // Emitimos la respuesta de actualización de lobby solo al Host

          const hostSocketId = this.tracingWsService.getRoomHostSocketId( client.data.roomPin ); 
          if( hostSocketId ){

            // Busca una sala llamada como el id del socket, en Socket.IO cada socket se une automáticamente a una sala con su propio ID
            const clients = await this.wss.in( hostSocketId ).fetchSockets();
            const hostClient = clients[0]; // Como el ID es único, solo vendrá uno

            hostClient.emit(ServerEvents.HOST_LOBBY_UPDATE, result.hostLobbyUpdate);

          }

          // actualizamos la info del nuevo jugador registrado en el servicio de tracing          
          this.tracingWsService.registerClientNickname( client );
          this.tracingWsService.logConnectedClients(); // Registramos en logging en memoria

        } else {

          this.handleError( client, res.getLeft() );
        }


    }


    
    @SubscribeMessage( PlayerUserEvents.PLAYER_SUBMIT_ANSWER )
    async handlePlayerSubmitAnswer( client: SessionSocket, payload: PlayerSubmitAnswerDto ){

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        if( !client.rooms.has( client.data.roomPin ))
          this.handleError( client, new Error("FATAL: El cliente no se encuentra conectado a la sala solicitada"));

        if( client.data.role !== SessionRoles.PLAYER )
          this.handleError( client, new Error("El Host de la partida no puede enviar preguntas"));
 

        const res: Either<Error, PlayerSubmitAnswerResponse> = 
          await this.commandBus.execute( new PlayerSubmitAnswerCommand( 
              payload.questionId,
              payload.answerId,
              payload.timeElapsedMs,
              client.data.roomPin,
              client.data.userId
          ));

        if( res.isRight() ){

          client.emit( ServerEvents.PLAYER_ANSWER_CONFIRMATION, { status: 'ANSWER SUCCESFULLY SUBMITTED' });

          // Emitimos la respuesta de actualización de lobby solo al Host

          const hostSocketId = this.tracingWsService.getRoomHostSocketId( client.data.roomPin ); 
          if( hostSocketId ){

            // Busca una sala llamada como el id del socket, en Socket.IO cada socket se une automáticamente a una sala con su propio ID
            const clients = await this.wss.in( hostSocketId ).fetchSockets();
            const hostClient = clients[0]; // Como el ID es único, solo vendrá uno

            hostClient.emit(ServerEvents.HOST_ANSWERS_UPDATE, res.getRight());
          }

        } else {


          this.handleError( client, res.getLeft() );

        }


    }

    // --------------------------------------------------------------------------
    // * Evento emitidos por el HOST
    // --------------------------------------------------------------------------
    @SubscribeMessage( HostUserEvents.HOST_START_GAME )
    async handleHostStartGame( client: SessionSocket ){

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        if( !(client.data.role === SessionRoles.HOST) )
          this.handleError( client, new WsException("El cliente no es Host"));

        if( !client.rooms.has( client.data.roomPin as string ))
          this.handleError( client, new WsException("FATAL: El HOST no se encuentra conectado a la sala solicitada"))
 

        const res: Either<Error, QuestionStartedResponse> = 
          await this.commandBus.execute( new HostStartGameCommand( client.data.roomPin ) );

        if( res.isRight() ){

          this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.getRight().data );

        } else {


          this.handleError( client, res.getLeft() );

        }


    }


    @SubscribeMessage( HostUserEvents.HOST_NEXT_PHASE )
    async handleHostNextPhase( client: SessionSocket ){

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        if( !(client.data.role === SessionRoles.HOST) )
          this.handleError( client, new WsException("El cliente no es Host"));

        if( !client.rooms.has( client.data.roomPin as string ))
          this.handleError( client, new WsException("FATAL: El HOST no se encuentra conectado a la sala solicitada"))
 

        const result: Either<Error, HostNextPhaseResponse > = 
          await this.commandBus.execute( new HostNextPhaseCommand( client.data.roomPin ) );

        if( result.isRight() ){


          const res = result.getRight();

          switch( res.type ){

            case HostNextPhaseType.QUESTION_STARTED:

              this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.data );
              break;  

            case HostNextPhaseType.QUESTION_RESULTS:{
  
                // Emitimos payload al Host
                client.emit( ServerEvents.HOST_RESULTS, res.hostData);

                // Emitimos la respuesta particular a cada Player
                const sockets = await this.wss.in( client.data.roomPin ).fetchSockets();
                for (const socket of sockets) {
                    if ( socket.data.role === SessionRoles.PLAYER ) {
                        socket.emit(ServerEvents.PLAYER_RESULTS, res.playerData.get( socket.data.userId ));
                    }
                }
                break;
            }

            case HostNextPhaseType.GAME_END:{
                // Si llegamos aquí, GARANTIZAMOS que está en la BD.  
                // Emitimos payload al Host
                client.emit( ServerEvents.HOST_GAME_END, res.hostData );
                // Emitimos la respuesta particular a cada Player
                const sockets = await this.wss.in( client.data.roomPin ).fetchSockets();
                for (const socket of sockets) {
                    if ( socket.data.role === SessionRoles.PLAYER ) {
                        socket.emit(ServerEvents.PLAYER_RESULTS, res.playerData.get( socket.data.userId ));
                    }
                }

            }
              break;
              
          }
          

        } else {

          this.handleError( client, result.getLeft() );

        }


    }

    @SubscribeMessage( HostUserEvents.HOST_END_SESSION )
    async handleHostEndSession( client: SessionSocket ){

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        // 1) SEGURIDAD: Verificar que quien ordena cerrar es el HOST
        if( !(client.data.role === SessionRoles.HOST) )
          this.handleError( client, new WsException("El cliente no es Host"));

        if( !client.rooms.has( client.data.roomPin as string ))
          this.handleError( client, new WsException("FATAL: El HOST no se encuentra conectado a la sala solicitada"));

        const roomPin = client.data.roomPin;

        if (!roomPin) return;
        
        await this.closeSession( roomPin );

    
    }

    // Método privado para gestionar cierres de sesión de manera segura
    private async closeSession( roomPin: string ){

        this.logger.log(`Host cerrando sesión y desconectando sala: ${roomPin}`);

        // 2) NOTIFICACIÓN FINAL (Graceful Shutdown)
        // Antes de cortar el cable, avisamos a los clientes para que el Frontend sepa que fue un cierre intencional y no un error de red.
        // Así evitamos que el cliente intente reconectarse automáticamente.
        this.wss.to(roomPin).emit(ServerEvents.SESSION_CLOSED, {
            reason: ServerEvents.SESSION_CLOSED,
            message:'El anfitrión ha finalizado la sesión.',
        });

        // 3) DESCONEXIÓN DE LA SALA
        // Esto desconecta a TODOS los sockets en esa sala (Host incluido)
        // El argumento 'true' fuerza el cierre del nivel bajo.
        await this.wss.in(roomPin).disconnectSockets(true);
        
        // 4) LIMPIEZA ADICIONAL (Opcional)
        // Limpiamos la sala del servicio de traza
        // Revisamos si la sesión quedo en memoria tras acabar la sesión pues este cierre pudo darse por una desconexión, lo que puede implicar un leak de memoria
        this.tracingWsService.removeRoom( roomPin );
        // TODO: Implementar caso de uso para borrar la sesión

        this.logger.log(`Sala con pin: ${ roomPin }, cerrada y eliminada exitosamente el ${ new Date().toString() }`);

    }

    // ? Este metodo solo sirve solo para cuando es llamado dentro de un metodo que esta decorado por un @SubscribeMessage()
    private handleError( client: SessionSocket, error: Error ): never {
  
        const message = error.message;

        // ! Error en consola para debugeo, quitar en produccion
        this.logger.error( error );

        // Mapeo de códigos de error a WsException
        if (message.startsWith(COMMON_ERRORS.SESSION_NOT_FOUND)) {

          client.emit(ServerErrorEvents.UNAVAILABLE_SESSION, {
            statusCode: 404,
            message: message,
          })

          throw new WsException('Sesión no encontrada: El pin no corresponde a ninguna partida activa');
        }
        
        // Si es un BadRequestException de Nest (de validación de entrada), re-lanzarlo
        if (error instanceof BadRequestException ) {

          client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
          })

          throw new WsException( message );
        }


        if (error instanceof WsException ) {

          client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
          })

          throw new WsException( message );
        }

        client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
        });
  
        throw new WsException( error ); // throw unhandled error
    }


}
