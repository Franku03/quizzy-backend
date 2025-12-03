import { Body, Controller, Post } from '@nestjs/common';
import { CreateSessionDto } from './dtos/create-session.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';

@Controller('multiplayer-sessions')
export class MultiplayerSessionsController {

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ){}


  @Post()
  createSession(
    @Body() createSessionDto: CreateSessionDto,
  ) {
    // await this.commandBus.execute( new CreateSessionCommand);
  }



}
