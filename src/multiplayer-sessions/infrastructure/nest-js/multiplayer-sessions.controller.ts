/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\multiplayer-sessions\infrastructure\nest-js\multiplayer-sessions.controller.ts

import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { CreateSessionDto } from './dtos/create-session.dto';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

import { CreateSessionCommand } from 'src/multiplayer-sessions/application/commands/create-session/create-session.command';
import { GetPinWithQrTokenCommand } from 'src/multiplayer-sessions/application/commands/get-pin-with-qr-token/get-pin-with-qr-token.command';
import { CreateSessionResponse, GetPinWithQrTokenResponse } from 'src/multiplayer-sessions/application/response-dtos';

import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';

@Controller('multiplayer-sessions')
export class MultiplayerSessionsController {

  constructor(

    private readonly executor: CommandQueryExecutorService,
    
  ){}

  // --- C O M A N D S (Mutación) ---

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @GetUserId() userId: string,
  ) {

    return await this.executor
            .executeCommand<CreateSessionResponse>( new CreateSessionCommand( createSessionDto.kahootId, userId ) );
    
  }


  // --- Q U E R I E S (Lectura) ---

  @Get('qr-token/:qrToken')
  @HttpCode(HttpStatus.OK)
  async getSessionPin(
    @Param('qrToken') qrToken: string,
  ) {

      return await this.executor
              .executeCommand<GetPinWithQrTokenResponse>( new GetPinWithQrTokenCommand( qrToken ) );

  }

}
