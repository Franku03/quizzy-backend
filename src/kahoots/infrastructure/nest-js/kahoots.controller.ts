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

import { CreateKahootDTO, UpdateKahootDTO } from './dtos'; 
import type { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/commands/input/kahoot.request.mapper';
import { KahootResponseDTO } from 'src/kahoots/application/commands/response-dto/kahoot.response.dto';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahootcommand';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { CommandQueryExecutorService } from './command-query-executor.service';
import { MockAuthGuard } from '';
import { GetUserId } from '';

@Controller('kahoots')
export class KahootController {
    constructor(
        private readonly executor: CommandQueryExecutorService,
        @Inject(KahootNestMapperAdapter) 
        private readonly kahootMapper: IKahootMapper<CreateKahootDTO, UpdateKahootDTO>
    ) {}

    // ✅ CUALQUIER usuario loggeado puede CREAR
    @Post()
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.CREATED)
    async createKahoot(
      @Body() input: CreateKahootDTO,
      @GetUserId() userId: string
    ): Promise<KahootResponseDTO> {
        const command = this.kahootMapper.toCreateCommand(input, userId); 
        return await this.executor.executeCommand<KahootResponseDTO>(command);
    }
    
    // ✅ Usuario loggeado puede EDITAR, pero el handler validará si es dueño
    @Put(':id') 
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.OK)
    async replaceKahoot(
        @Param('id') kahootId: string,
        @Body() input: UpdateKahootDTO,
        @GetUserId() userId: string
    ): Promise<KahootResponseDTO> {
        const command = this.kahootMapper.toUpdateCommand(input, kahootId, userId);
        return await this.executor.executeCommand<KahootResponseDTO>(command);
    }

    // ✅ CUALQUIERA puede VER (según visibilidad)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getKahootById(
        @Param('id') kahootId: string,
        @GetUserId() userId?: string // Opcional para visibilidad
    ) {
        const query = new GetKahootByIdQuery(kahootId, userId);
        return await this.executor.executeQueryOptional(
            query, 
            kahootId, 
            'Kahoot'
        );
    }

    // ✅ Usuario loggeado puede ELIMINAR, pero el handler validará si es dueño
    @Delete(':id')
    @UseGuards(MockAuthGuard)
    @HttpCode(HttpStatus.NO_CONTENT) 
    async deleteKahoot(
        @Param('id') kahootId: string,
        @GetUserId() userId: string
    ): Promise<void> {
        const command = new DeleteKahootCommand(kahootId, userId);
        await this.executor.executeCommand<void>(command);
    }
}