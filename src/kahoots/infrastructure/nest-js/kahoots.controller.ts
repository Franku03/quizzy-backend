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
import type { IKahootRequestMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/mappers/kahoot.request.mapper';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahootcommand';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { CommandQueryExecutorService } from './command-query-executor.service';
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';

@Controller('kahoots')
export class KahootController {
    constructor(
        private readonly executor: CommandQueryExecutorService,
        @Inject(KahootNestMapperAdapter) 
        private readonly kahootMapper: IKahootRequestMapper<CreateKahootDTO, UpdateKahootDTO>
    ) {}

    // CUALQUIER usuario loggeado puede CREAR
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
    
    // Usuario loggeado puede EDITAR, pero el handler validará si es dueño
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

    // CUALQUIERA puede VER (según visibilidad - PRIVATE SOLO OWNER)
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async getKahootById(
        @Param('id') kahootId: string,
        @GetUserId() userId?: string // Opcional para visibilidad
    ) {
        const query = new GetKahootByIdQuery({kahootId, userId});
        return await this.executor.executeQueryOptional(
            query, 
            kahootId, 
            'Kahoot'
        );
    }

    // Usuario loggeado puede ELIMINAR, pero el handler validará si es dueño
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
}