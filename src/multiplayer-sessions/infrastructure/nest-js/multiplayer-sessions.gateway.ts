import { BadRequestException, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { CommandBus } from 'src/core/infrastructure/cqrs';
import { MultiplayerSessionsTracingService } from './multiplayer-sessions.tracing.service';

import { SessionRoles } from './enums/session-roles.enum';
import { HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents } from './enums/websocket.events.enum';
import type { SessionSocket  } from './interfaces/socket-definitions.interface';


import { 
  HostNextPhaseCommand, 
  HostStartGameCommand, 
  PlayerJoinCommand, 
  PlayerSubmitAnswerCommand 
} from 'src/multiplayer-sessions/application/commands';

import { 
  HostNextPhaseType, 
  GameStateUpdateResponse, 
  HostNextPhaseResponse, 
  QuestionStartedResponse 
} from 'src/multiplayer-sessions/application/response-dtos';


import { COMMON_ERRORS } from 'src/multiplayer-sessions/application/commands/common.errors';

import { Either } from 'src/core/types/either';
import { mapPayloadToPlayer } from 'src/multiplayer-sessions/application/helpers/map-payload-to-player.helper';
import { PlayerJoinDto, PlayerSubmitAnswerDto } from './dtos';
import { register } from 'module';



@WebSocketGateway( 
  { namespace: 'multiplayer-sessions', cors: true }
)
export class MultiplayerSessionsGateway  implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;
    private readonly logger: Logger = new Logger('WebSocketGateway')

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
        // ! Verificar que el pin de la partida asociada exista

        if( !pin || !role || !jwt )
          throw new WsException("Hacen falta datos en el header para realizar la conexión");


        if ( role === SessionRoles.HOST ) {
  
            // ! Validar que este usuario es realmente el dueño de la sesión 'pin'
  
            this.tracingWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo
              
            client.emit( ServerEvents.HOST_CONNECTED_SUCCESS, { status: 'IN_LOBBY - CONNECTED TO SERVER' });
              
        } else if( role === SessionRoles.PLAYER ){
  
          client.emit( ServerEvents.PLAYER_CONNECTED_TO_SERVER , { status: 'IN_LOBBY - CONNECTED TO SERVER' });
            
        } else {
  
          client.disconnect(); // En caso de no ser ninguno de esos roles, desconecto inmediatamente
  
        }

        // Gestionamos la union a la sala y al logger - Creo que un mismo usuario se puede a conectar a mas de una sala
        client.join( pin );

        this.tracingWsService.registerClient( client ); // Registramos Jugador en nuestro servicio de Loggeo

        // Guardamos la data de los clientes en su propio socket
        client.data.roomPin = pin as string;

        client.data.role = role as SessionRoles;

        client.data.userId = jwt as string; // TODO: Cuando lo podamos obtener con el JWT realmente adjuntaremos aqui el UserID obtenido mediante el mismo
        
        console.log(`${client.data.role} conectado a la sala ${pin}`); // Para pruebas iniciales
        console.log('Cliente conectado:', client.id ); // Para pruebas iniciales
  
        // this.tracingWsService.logConnectedClients(); // Registramos en logging en memoria
        
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
        this.logger.log(`Cliente ${client.id} desconectado después de error.`);

      }



    }

    handleDisconnect( client: SessionSocket) {

      const roomPin = client.handshake.headers?.pin as string;

      client.disconnect(); // ? Algo dudoso, pero por si acaso

      console.log('Cliente Desconectado', client.id );
      try {

        this.tracingWsService.removeClient( roomPin ,client.id );

      } catch (error) {

        this.logger.warn(`Error al intentar remover cliente ${client.id}: ${error.message}`);

      }
      
    }


    // ? Eventos del jugador
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
          const sockets = await this.wss.in( client.data.roomPin ).fetchSockets();
          for (const socket of sockets) {
              if ( socket.data.role === SessionRoles.HOST ) {
                  socket.emit(ServerEvents.HOST_LOBBY_UPDATE, result.hostLobbyUpdate);
                  break;
              }
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
 

        const res: Either<Error, boolean> = 
          await this.commandBus.execute( new PlayerSubmitAnswerCommand( 
              payload.questionId,
              payload.answerId,
              payload.timeElapsedMs,
              client.data.roomPin,
              client.data.userId
          ));

        if( res.isRight() ){

          client.emit( ServerEvents.PLAYER_ANSWER_CONFIRMATION, { status: 'ANSWER SUCCESFULLY SUBMITTED' });

        } else {


          this.handleError( client, res.getLeft() );

        }


    }

    // ? Eventos del Host

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
                        // * creo que no hace falta el helper realmente
                        const playerPayload = mapPayloadToPlayer( res , socket.data.userId );
                        socket.emit(ServerEvents.PLAYER_RESULTS, playerPayload);
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
        
        // 4. LIMPIEZA ADICIONAL (Opcional)
        // Limpiamos la sala del servicio de traza
        this.logger.log(`Sala con pin: ${ roomPin }, cerrada y eliminada exitosamente el ${ new Date().toString }`)
    
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
