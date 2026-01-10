/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\infrastructure\nest-js\kahoots.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Put,
  Param,
  Delete,
  Get,
  UseGuards,
  Inject,
} from '@nestjs/common';

// Core & Types
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

// Comandos y Consultas
import { CreateKahootCommand, UpdateKahootCommand } from 'src/kahoots/application/commands';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.command';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';

// DTOs e Inputs de Mappers
import { CreateKahootDTO, UpdateKahootDTO } from '../dtos';
import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';
import { CreateKahootInput } from '../adapters/mappers/create-kahoot.request.mapper';
import { ReplaceKahootInput } from '../adapters/mappers/update-kahoot.request.mapper';

// Helpers & Guards
import { GetUserId } from 'src/core/nest-js/decorators/get-user-id.decorator';
import { Auth } from 'src/auth/infrastructure/decorators/auth.decorator';
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';
import { GetKahootUserDetailById } from 'src/kahoots/application/queries/get-kahoot-preview-by-id/get-kahoot-user-detail-by-id.query';

@Controller('kahoots')
export class KahootController {

  constructor(
    private readonly executor: CommandQueryExecutorService,

    // Inyección por Tokens para desacoplar de la implementación concreta
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.CREATE_KAHOOT_REQUEST)
    private readonly createMapper: IMapper<CreateKahootInput, CreateKahootCommand>,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.UPDATE_KAHOOT_REQUEST)
    private readonly updateMapper: IMapper<ReplaceKahootInput, UpdateKahootCommand>,
  ) { }

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createKahoot(
    @Body() dto: CreateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponseDto> {
    const command = this.createMapper.map({ dto, userId });
    return await this.executor.executeCommand<KahootHandlerResponseDto>(command);
  }

  @Put(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async replaceKahoot(
    @Param('id') id: string,
    @Body() dto: UpdateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponseDto> {
    const command = this.updateMapper.map({ dto, id, userId });
    return await this.executor.executeCommand<KahootHandlerResponseDto>(command);
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKahoot(
    @Param('id') id: string,
    @GetUserId() userId: string
  ): Promise<void> {
    const command = new DeleteKahootCommand({ id, userId });
    await this.executor.executeCommand<void>(command);
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getKahootById(
    @Param('id') kahootId: string,
    @GetUserId() userId?: string
  ): Promise<KahootHandlerResponseDto> {
    const query = new GetKahootByIdQuery({ kahootId, userId });
    return await this.executor.executeQuery<KahootHandlerResponseDto>(query);
  }

  @Get('inspect/:idKahoot') // Usando el path exacto que pediste
  @Auth()
  @HttpCode(HttpStatus.OK)
  async inspectKahoot(
    @Param('idKahoot') kahootId: string,
    @GetUserId() userId: string
  ): Promise<KahootUserDetailReadModel> {
    const query = new GetKahootUserDetailById({ kahootId, userId });
    return await this.executor.executeQuery<KahootUserDetailReadModel>(query);
  }
}