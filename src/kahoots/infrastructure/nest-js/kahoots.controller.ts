// src/kahoots/infrastructure/controllers/kahoot.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
  Put,
  Param,
  Delete,
  Get,
  UseGuards,
} from '@nestjs/common';

import { CreateKahootDTO, UpdateKahootDTO } from '../dtos'; 
import type { IKahootRequestMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/mappers/kahoot.request.mapper';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahootcommand';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

@Controller('kahoots')
export class KahootController {
  
  constructor(
    private readonly executor: CommandQueryExecutorService,
    @Inject(KahootNestMapperAdapter) 
    private readonly kahootMapper: IKahootRequestMapper<CreateKahootDTO, UpdateKahootDTO>
  ) {}

  // Commands
  @Post()
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createKahoot(
    @Body() input: CreateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponse> {
    const command = this.kahootMapper.toCreateCommand(input, userId); 
    return await this.executor.executeCommand<KahootHandlerResponse>(command);
  }
  
  @Put(':id') 
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async replaceKahoot(
    @Param('id') kahootId: string,
    @Body() input: UpdateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponse> {
    const command = this.kahootMapper.toReplaceCommand(input, kahootId, userId);
    return await this.executor.executeCommand<KahootHandlerResponse>(command);
  }

  @Delete(':id')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT) 
  async deleteKahoot(
    @Param('id') id: string,
    @GetUserId() userId: string
  ): Promise<void> {
    const command = new DeleteKahootCommand({id, userId});
    await this.executor.executeCommand<void>(command);
  }
  
  // Queries
  @Get(':id')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getKahootById(
    @Param('id') kahootId: string,
    @GetUserId() userId?: string
  ): Promise<KahootHandlerResponse> {
    const query = new GetKahootByIdQuery({kahootId, userId});
    return await this.executor.executeQuery<KahootHandlerResponse>(query);
  }
}