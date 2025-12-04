import { BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MultiplayerSessionsService } from './multiplayer-sessions.logging.service';
import { SessionRoles } from './enums/session-roles.enum';

import { PlayerUserEvents, ServerErrorEvents, ServerEvents } from './enums/websocket.events.enum';
import { PlayerJoinDto } from './dtos/player-join.dto';
import { CommandBus } from '@nestjs/cqrs';
import { JoinPlayerCommand } from 'src/multiplayer-sessions/application/commands/join-player/join-player.command';
import { Either } from 'src/core/types/either';

import { COMMON_ERRORS } from 'src/multiplayer-sessions/application/commands/common.errors';
import { GameStateUpdateResponse } from 'src/multiplayer-sessions/application/response-dtos/game-state-update.response.dto';


@WebSocketGateway( 
  +process.env.WEB_SOCKET_SERVER_PORT! || 3003, 
  { namespace: 'multiplayer-sessions', cors: true }
)
export class MultiplayerSessionsGateway  implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    private logger = new Logger('WebSocketGateway');

    constructor(
      // * Quitar el servicio, esta para realizar impresiones en consola
      private readonly loggingWsService: MultiplayerSessionsService,
      private readonly commandBus: CommandBus,
      
    ) {
      this.logger.log(`WebSocketServer running on port ${ process.env.WEB_SOCKET_SERVER_PORT || 3003}`);
    }

    async handleConnection( client: Socket ) {

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT

      const { pin , role, jwt, nickname } = client.handshake.headers

      
      try {
        // ! Verificar que el pin de la partida asociada exista

        if( !pin || !role || !jwt || !nickname )
          throw new WsException("Hacen falta datos en el header para realizar la conexión");


        if ( role === SessionRoles.HOST ) {
  
            // ! Validar que este usuario es realmente el dueño de la sesión 'pin'
  
            this.loggingWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo
  
            this.loggingWsService.registerClient( client ); // Registramos Host en nuestro servicio de Loggeo
  
            // Unir este socket a la Room del PIN
            client.join( pin );
            
            client.emit( ServerEvents.HOST_CONNECTED_SUCCESS , { status: 'LOBBY_READY' });
            
            console.log(`Host conectado a la sala ${pin}`);
            
        } else if( role === SessionRoles.PLAYER ){
  
          this.loggingWsService.registerClient( client ); // Registramos Jugador en nuestro servicio de Loggeo
  
          client.join( pin );
  
          client.emit( ServerEvents.PLAYER_CONNECTED_SUCCESS , { status: 'LOBBY_READY' });
            
          console.log(`Jugador conectado a la sala ${pin}`);
  
        } else {
  
          client.disconnect(); // En caso de no ser ninguno de esos roles, desconecto inmediatamente
  
        }
  
        console.log('Cliente conectado:', client.id ); // Para pruebas iniciales
  
        this.loggingWsService.logConnectedClients();
        
      } catch (error) {
        
        // 1) Loggea el error para el servidor
        this.logger.error(`Fallo en la conexión del cliente ${client.id}:`, error);

        let errorMessage = 'Error desconocido en el servidor.';
        
        // 2) Determinar el mensaje de error para el cliente
        if (error instanceof WsException) {
            // Si es una WsException, extrae el mensaje de error para el cliente.
            // Si WsException se envuelve con otro error, usa error.message
            errorMessage = error.message; 

        } else if (error instanceof Error) {

            // Manejar otros errores 
            errorMessage = error.message;

        }

        // 3) Notificar al cliente (importante: usa un evento conocido)
        client.emit( ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400, // O el código que decidas usar
            message: errorMessage
        });
        
        // 4) Terminar la conexión para el cliente defectuoso
        // Retrasar la desconexión para permitir el envío del evento 
        client.disconnect(true);
        this.logger.log(`Cliente ${client.id} desconectado después de error.`);

      }



    }

    handleDisconnect( client: Socket ) {

      const roomPin = client.handshake.headers?.pin as string;

      client.disconnect(); // ? Algo dudoso, pero por si acaso

      console.log('Cliente Desconectado', client.id );
      try {

        this.loggingWsService.removeClient( roomPin ,client.id );

      } catch (error) {

        this.logger.warn(`Error al intentar remover cliente ${client.id}: ${error.message}`);

      }
      
    }

    @SubscribeMessage( PlayerUserEvents.PLAYER_JOIN )
    async handlePlayerJoin( client: Socket, payload: PlayerJoinDto ){
      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        // console.log( payload );

        if( !client.rooms.has( payload.sessionPin ))
          this.handleError( client, new Error("FATAL: El cliente no se encuentra conectado a la sala solicitada"))
 

        const res: Either<Error, GameStateUpdateResponse> = 
          await this.commandBus.execute( new JoinPlayerCommand( payload.userId, payload.nickname, payload.sessionPin ) );

        if( res.isRight() ){

          this.wss.to( payload.sessionPin ).emit( ServerEvents.GAME_STATE_UPDATE, res.getRight() );
          client.emit(ServerEvents.PLAYER_CONNECTED_SUCCESS);

        } else {

          this.handleError( client, res.getLeft() );
        }


    }
    

    // Esto sirve solo para cuando es llamada dentro de un metodo que esta decorado por un @SubscribeMessage()
    private handleError( client: Socket, error: Error ): never {
  
        const message = error.message;

        // ! Error en consola para debugeo, quitar en produccion
        this.logger.error( error );

        // Mapeo de códigos de error a excepciones HTTP
        if (message.startsWith(COMMON_ERRORS.SESSION_NOT_FOUND)) {

          client.emit(ServerErrorEvents.UNAVAILABLE_SESSION, {
            statusCode: 404,
            message: message,
          })

          throw new WsException('Sesión no encontrada: El pin no corresponde a ninguna partida activa');
        }
        
        // if (message.startsWith(CREATE_SESSION_ERRORS.USER_UNAUTHORIZED)) {
        //   throw new UnauthorizedException('El usuario autenticado (Host) no tiene permisos para crear una sesión con el Kahoot solcitado.');
        // }
        
        // if (message.startsWith(QR_TOKEN_ERRORS.QR_NOT_FOUND)) {
        //   throw new NotFoundException("El código QR o token no está asociado a una sesión activa.");
        // }
  
        // Si es un BadRequestException de Nest (de validación de entrada), re-lanzarlo
        if (error instanceof BadRequestException ) {

          client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
          })

          throw error;
        }


        if (error instanceof WsException ) {

          client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
          })

          throw error;
        }
  
        // ! Error en consola para debugeo, quitar en produccion
        this.logger.error( error );

        client.emit(ServerErrorEvents.FATAL_ERROR, {
            statusCode: 400,
            message: message,
        });
  
        throw new WsException( error ); // throw unhandled error
    }


}
