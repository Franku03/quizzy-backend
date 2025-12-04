import { BadRequestException, Body, Controller, Get, HttpCode, InternalServerErrorException, Logger, NotFoundException, Param, Post, UnauthorizedException } from '@nestjs/common';
import { CreateSessionDto } from './dtos/create-session.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { CreateSessionCommand } from 'src/multiplayer-sessions/application/commands/create-session/create-session.command';
import { GetPinWithQrTokenCommand } from 'src/multiplayer-sessions/application/commands/get-pin-with-qr-token/get-pin-with-qr-token.command';
import { CreateSessionResponse } from 'src/multiplayer-sessions/application/response-dtos/create-session.response.dto';

import { Either } from 'src/core/types/either';
import { CREATE_SESSION_ERRORS, QR_TOKEN_ERRORS } from 'src/multiplayer-sessions/application/commands';

@Controller('multiplayer-sessions')
export class MultiplayerSessionsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ){}

  // TODO: Agregar obtencion del ID del usuario a traves del JWT por los headers
  @Post()
  @HttpCode( 201 )
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    // TODO: @GetUser('id') userId: string,
  ) {

    const res: Either<Error,CreateSessionResponse> = 
        await this.commandBus.execute( new CreateSessionCommand( createSessionDto.kahootId, createSessionDto.userId ) );
      
    if( res.isRight() ){

      return res.getRight()

    } else {

      this.handleError( res.getLeft() )


    }

  }

  @Get('qr-token/:qrToken')
  async getSessionPin(
    @Param('qrToken') qrToken: string,
    // TODO: @GetUser('id') userId: string,
  ) {

      const res: Either<Error,CreateSessionResponse> =
          await this.commandBus.execute( new GetPinWithQrTokenCommand( qrToken ) );

      if( res.isRight() ){

        return res.getRight()

      } else {

        this.handleError( res.getLeft() )


      }
 
  }

  private handleError( error: Error ): never {

      const message = error.message

      // Mapeo de códigos de error a excepciones HTTP
      if (message.startsWith(CREATE_SESSION_ERRORS.KAHOOT_NOT_FOUND)) {
        throw new NotFoundException('El Kahoot no existe');
      }
      
      if (message.startsWith(CREATE_SESSION_ERRORS.USER_UNAUTHORIZED)) {
        throw new UnauthorizedException('El usuario autenticado (Host) no tiene permisos para crear una sesión con el Kahoot solcitado.');
      }
      
      if (message.startsWith(QR_TOKEN_ERRORS.QR_NOT_FOUND)) {
        throw new NotFoundException("El código QR o token no está asociado a una sesión activa.");
      }

      // Si es un BadRequestException de Nest (de validación de entrada), re-lanzarlo
      if (error instanceof BadRequestException ) {
        throw error;
      }

      // ! Error en consola para debugeo, quitar en produccion
      const logger = new Logger('Multiplayer-Session-Controller');
      logger.error( error );

      throw new InternalServerErrorException( error ); // throw unhandled error
  }

}
