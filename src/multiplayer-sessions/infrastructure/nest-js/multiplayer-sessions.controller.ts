import { Body, Controller, Post } from '@nestjs/common';
import { CreateSessionDto } from './dtos/create-session.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateSessionCommand } from 'src/multiplayer-sessions/application/commands/create-session.command';

@Controller('multiplayer-sessions')
export class MultiplayerSessionsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ){}

  // TODO: Agregar obtencion del ID del usuario a traves del JWT por los headers
  @Post()
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    // TODO: @GetUser('id') userId: string,
  ) {
      await this.commandBus.execute( new CreateSessionCommand( createSessionDto.kahootId, createSessionDto.userId ) );
  }



}
