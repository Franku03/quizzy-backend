// src/kahoots/infrastructure/controllers/kahoot.controller.ts
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
} from '@nestjs/common';

import { CreateKahootDTO, UpdateKahootDTO } from '../dtos'; 
import { KahootHandlerResponseDto } from 'src/kahoots/application/dtos/kahoot.handler.response.dto';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahoot.command';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';
import { CommandQueryExecutorService } from 'src/core/infrastructure/services/command-query-executor.service';

// Importamos los nuevos mappers
import { CreateKahootRequestMapper } from '../adapters/mappers/create-kahoot.request.mapper';
import { UpdateKahootRequestMapper } from '../adapters/mappers/update-kahoot.request.mapper';

@Controller('kahoots')
export class KahootController {
  
  constructor(
    private readonly executor: CommandQueryExecutorService,
    private readonly createMapper: CreateKahootRequestMapper,
    private readonly updateMapper: UpdateKahootRequestMapper,
  ) {}

  @Post()
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createKahoot(
    @Body() dto: CreateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponseDto> {
    const command = this.createMapper.map({ dto, userId }); 
    return await this.executor.executeCommand<KahootHandlerResponseDto>(command);
  }
  
  @Put(':id') 
  @UseGuards(MockAuthGuard)
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
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT) 
  async deleteKahoot(
    @Param('id') id: string,
    @GetUserId() userId: string
  ): Promise<void> {
    const command = new DeleteKahootCommand({ id, userId });
    await this.executor.executeCommand<void>(command);
  }
  
  @Get(':id')
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getKahootById(
    @Param('id') kahootId: string,
    @GetUserId() userId?: string
  ): Promise<KahootHandlerResponseDto> {
    const query = new GetKahootByIdQuery({ kahootId, userId });
    return await this.executor.executeQuery<KahootHandlerResponseDto>(query);
  }
}