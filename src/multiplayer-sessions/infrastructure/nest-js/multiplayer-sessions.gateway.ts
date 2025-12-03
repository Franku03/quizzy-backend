import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MultiplayerSessionsService } from './multiplayer-sessions.logging.service';
import { SessionRoles } from './enums/session-roles.enum';
import { ServerEvents } from './enums/websocket.events.enum';


@WebSocketGateway( 
  +process.env.WEB_SOCKET_SERVER_PORT! || 3003, 
  { namespace: 'multiplayer-sessions', cors: true }
)
export class MultiplayerSessionsGateway  implements OnGatewayConnection, OnGatewayDisconnect {

    @WebSocketServer() wss: Server;

    private logger = new Logger('WebSocketGateway');

    constructor(
      // ! Quitar el servicio, esta para realizar impresiones en consola
      private readonly messagesWsService: MultiplayerSessionsService,
    ) {
      this.logger.log(`WebSocketServer running on port ${ process.env.WEB_SOCKET_SERVER_PORT || 3003}`);
    }

    async handleConnection( client: Socket ) {

      // console.log( client.handshake );

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT

      const { pin , role, jwt, nickname } = client.handshake.headers

      if( !pin || !role || !jwt || !nickname )
        throw new WsException("Hacen falta datos en el header para realizar la conexión");


      if ( role === SessionRoles.HOST ) {

          // ! Validar que este usuario es realmente el dueño de la sesión 'pin'

          this.messagesWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo

          this.messagesWsService.registerClient( client ); // Registramos Host en nuestro servicio de Loggeo

          // Unir este socket a la Room del PIN
          client.join( pin );
          
          // 3. (Opcional) Emitir confirmación al Host
          client.emit( ServerEvents.HOST_CONNECTED_SUCCESS , { status: 'LOBBY_READY' });
          
          console.log(`Host conectado a la sala ${pin}`);
          
      } else if( role === SessionRoles.PLAYER ){

        this.messagesWsService.registerClient( client ); // Registramos Jugador en nuestro servicio de Loggeo

        client.join( pin );

        client.emit( ServerEvents.PLAYER_CONNECTED_SUCCESS , { status: 'LOBBY_READY' });
          
        console.log(`Jugador conectado a la sala ${pin}`);

      } else {

        client.disconnect(); // En caso de error anulo la conexion

      }

      console.log('Cliente conectado:', client.id ); // Para pruebas iniciales
      console.log({ conectados: this.messagesWsService.getConnectedClients() });

    }

    handleDisconnect( client: Socket ) {

      const roomPin = client.handshake.headers.pin as string;

      client.disconnect();

      console.log('Cliente Desconectado', client.id );
      this.messagesWsService.removeClient( roomPin ,client.id );
      
    }


}
