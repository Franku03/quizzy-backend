import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { MultiplayerSessionsService } from './multiplayer-sessions.service';


@WebSocketGateway( +process.env.WEB_SOCKET_SERVER_PORT! || 3003, { namespace: 'game-sessions', cors: true })
export class MultiplayerSessionsGateway  implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer() wss: Server;

  private logger = new Logger('WebSocketGateway');

  constructor(
    // TODO: Quitar el servicio, esta para realizar impresiones en consola
    private readonly messagesWsService: MultiplayerSessionsService,
  ) {
    this.logger.log(`WebSocketServer running on port ${ process.env.WEB_SOCKET_SERVER_PORT || 3003}`);
  }

  async handleConnection( client: Socket ) {

    this.messagesWsService.registerClient( client );

    console.log('Cliente conectado:', client.id ); // Para pruebas iniciales
    console.log({ conectados: this.messagesWsService.getConnectedClients() })

  }
  
  handleDisconnect( client: Socket ) {
    console.log('Cliente Desconectado', client.id );
    this.messagesWsService.removeClient( client.id );
    
  }


}
