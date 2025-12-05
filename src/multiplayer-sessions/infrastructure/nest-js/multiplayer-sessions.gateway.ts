import { BadRequestException, Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from '@nestjs/websockets';
import { CommandBus } from '@nestjs/cqrs';
import { Server } from 'socket.io';

import { MultiplayerSessionsService } from './multiplayer-sessions.logging.service';

import { SessionRoles } from './enums/session-roles.enum';
import { HostUserEvents, PlayerUserEvents, ServerErrorEvents, ServerEvents } from './enums/websocket.events.enum';
import { COMMON_ERRORS } from 'src/multiplayer-sessions/application/commands/common.errors';
import type { SessionSocket  } from './interfaces/socket-definitions.interface';

import { JoinPlayerCommand } from 'src/multiplayer-sessions/application/commands/join-player/join-player.command';
import { HostStartGameCommand } from 'src/multiplayer-sessions/application/commands/host-start-game/host-start-game.command';
import { GameStateUpdateResponse } from 'src/multiplayer-sessions/application/response-dtos/game-state-update.response.dto';
import { QuestionStartedResponse } from 'src/multiplayer-sessions/application/response-dtos/question-started.response.dto';

import { Either } from 'src/core/types/either';
import { PlayerSubmitAnswerCommand } from 'src/multiplayer-sessions/application/commands/player-submit-answer/player-submit-answer.command';
import { PlayerSubmitAnswerDto } from './dtos/player-submit-answer.dto';
import { HostNextPhaseCommand } from 'src/multiplayer-sessions/application/commands/host-next-phase/host-next-phase.command';
import { SessionStateType } from 'src/multiplayer-sessions/domain/value-objects';
import { QuestionResultsResponse } from 'src/multiplayer-sessions/application/response-dtos/question-results.response.dto';
import { SaveSessionCommand } from 'src/multiplayer-sessions/application/commands/save-session/save-session.command';



@WebSocketGateway( 
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

    async handleConnection( client: SessionSocket ) {

      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT

      const { pin , role, jwt, nickname, } = client.handshake.headers 
      
      try {
        // ! Verificar que el pin de la partida asociada exista

        if( !pin || !role || !jwt || !nickname )
          throw new WsException("Hacen falta datos en el header para realizar la conexión");


        if ( role === SessionRoles.HOST ) {
  
            // ! Validar que este usuario es realmente el dueño de la sesión 'pin'
  
            this.loggingWsService.registerRoom( client ); // Registramos La sala en nuestro servicio de Loggeo
              
            client.emit( ServerEvents.HOST_CONNECTED_SUCCESS, { status: 'IN_LOBBY - CONNECTED TO SERVER' });
              
        } else if( role === SessionRoles.PLAYER ){
  
          client.emit( ServerEvents.PLAYER_CONNECTED_TO_SERVER , { status: 'IN_LOBBY - CONNECTED TO SERVER' });
            
        } else {
  
          client.disconnect(); // En caso de no ser ninguno de esos roles, desconecto inmediatamente
  
        }

        // ? Gestionamos la union a la sala y al logger - Creo que un mismo usuario se puede a conectar a mas de una sala
        client.join( pin );

        this.loggingWsService.registerClient( client ); // Registramos Jugador en nuestro servicio de Loggeo

        console.log(`${client.data.role} conectado a la sala ${pin}`);


        // ? Guardamos la data de los clientes en su propio socket
        client.data.roomPin = pin as string;

        client.data.role = role as SessionRoles;

        client.data.nickname = nickname as string;

        client.data.userId = jwt as string; // * Cuando lo podamos obtener con el JWT realmente adjuntaremos aqui el UserID obtenido mediante el mismo
        
        console.log('Cliente conectado:', client.id ); // Para pruebas iniciales
  
        this.loggingWsService.logConnectedClients(); // Registramos en logging en memoria
        
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

        this.loggingWsService.removeClient( roomPin ,client.id );

      } catch (error) {

        this.logger.warn(`Error al intentar remover cliente ${client.id}: ${error.message}`);

      }
      
    }


    // ? Eventos del jugador
    @SubscribeMessage( PlayerUserEvents.PLAYER_JOIN )
    async handlePlayerJoin( client: SessionSocket ){
      // TODO: Cuando el modulo Auth este integrado implementar logica de verificacion de JWT para extraer IdUser y username

        if( !client.rooms.has( client.data.roomPin ))
          this.handleError( client, new Error("FATAL: El cliente no se encuentra conectado a la sala solicitada"));

        if( client.data.role !== SessionRoles.PLAYER )
          this.handleError( client, new Error("El Host de la partida no puede unrise a la sesion de juego"));
 

        const res: Either<Error, GameStateUpdateResponse> = 
          await this.commandBus.execute( new JoinPlayerCommand( client.data.userId, client.data.nickname, client.data.roomPin ) );

        if( res.isRight() ){

          this.wss.to( client.data.roomPin ).emit( ServerEvents.GAME_STATE_UPDATE, res.getRight() );
          client.emit(ServerEvents.PLAYER_CONNECTED_TO_SESSION, { status: 'CONNECTED TO SESSION AS PLAYER' });

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

          // this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.getRight() );

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

          this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.getRight() );

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
 

        const res: Either<Error, QuestionStartedResponse | QuestionResultsResponse > = 
          await this.commandBus.execute( new HostNextPhaseCommand( client.data.roomPin ) );

        if( res.isRight() ){

          const state = res.getRight().state

          if( state === SessionStateType.RESULTS ){

            this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_RESULTS, res.getRight() );

          } else if ( state === SessionStateType.QUESTION ) {
            
            this.wss.to( client.data.roomPin ).emit( ServerEvents.QUESTION_STARTED, res.getRight() );

          } else {

            // ! Definitivamente necesitamos eventos de dominio, este handler quedo muy feo en codigo, esta logica deberia estar fuera
            const saveRes: Either<Error, boolean > = 
              await this.commandBus.execute( new SaveSessionCommand( client.data.roomPin ) );

            if( saveRes.isLeft() )
              this.handleError( client, saveRes.getLeft() );


            this.wss.to( client.data.roomPin ).emit( ServerEvents.GAME_END, res.getRight() )
          }
          

        } else {


          this.handleError( client, res.getLeft() );

        }


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
