/**
 * MIT License | Copyright (c) 2025
 */

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
  Inject,
} from '@nestjs/common';

// Core & Types
import { CommandBus, QueryBus } from 'src/core/infrastructure/cqrs';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

// Comandos y Consultas
import {
  CreateKahootCommand,
  UpdateKahootCommand,
} from 'src/kahoots/application/commands';
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
import { Either, ErrorData } from 'src/core/types';

@Controller('kahoots')
export class KahootController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.CREATE_KAHOOT_REQUEST)
    private readonly createMapper: IMapper<
      CreateKahootInput,
      CreateKahootCommand
    >,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.UPDATE_KAHOOT_REQUEST)
    private readonly updateMapper: IMapper<
      ReplaceKahootInput,
      UpdateKahootCommand
    >,
  ) {}

  @Post()
  @Auth()
  @HttpCode(HttpStatus.CREATED)
  async createKahoot(
    @Body() dto: CreateKahootDTO,
    @GetUserId() userId: string,
  ): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const command = this.createMapper.map({ dto, userId });
    // Casting a Either para que el linter sepa qué devuelve el bus
    return (await this.commandBus.execute(command)) as Either<
      ErrorData,
      KahootHandlerResponseDto
    >;
  }

  @Put(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async replaceKahoot(
    @Param('id') id: string,
    @Body() dto: UpdateKahootDTO,
    @GetUserId() userId: string,
  ): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const command = this.updateMapper.map({ dto, id, userId });
    return (await this.commandBus.execute(command)) as Either<
      ErrorData,
      KahootHandlerResponseDto
    >;
  }

  @Delete(':id')
  @Auth()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteKahoot(
    @Param('id') id: string,
    @GetUserId() userId: string,
  ): Promise<Either<ErrorData, void>> {
    const command = new DeleteKahootCommand({ id, userId });
    return (await this.commandBus.execute(command)) as Either<ErrorData, void>;
  }

  @Get(':id')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async getKahootById(
    @Param('id') kahootId: string,
    @GetUserId() userId?: string,
  ): Promise<Either<ErrorData, KahootHandlerResponseDto>> {
    const query = new GetKahootByIdQuery({ kahootId, userId });
    return (await this.queryBus.execute(query)) as Either<
      ErrorData,
      KahootHandlerResponseDto
    >;
  }

  @Get('inspect/:idKahoot')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async inspectKahoot(
    @Param('idKahoot') kahootId: string,
    @GetUserId() userId: string,
  ): Promise<Either<ErrorData, KahootUserDetailReadModel>> {
    const query = new GetKahootUserDetailById({ kahootId, userId });
    return (await this.queryBus.execute(query)) as Either<
      ErrorData,
      KahootUserDetailReadModel
    >;
  }
}
