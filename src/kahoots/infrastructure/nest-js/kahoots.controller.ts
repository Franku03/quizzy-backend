// src/kahoots/infrastructure/nest-js/controllers/kahoot.controller.ts
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
} from '@nestjs/common';

import { CreateKahootDTO, UpdateKahootDTO } from './dtos'; 
import type { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/commands/input/kahoot.request.mapper';
import { KahootResponseDTO } from 'src/kahoots/application/commands/response-dto/kahoot.response.dto';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahootcommand';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { CommandQueryExecutorService } from './command-query-executor.service';

@Controller('kahoots')
export class KahootController {
    constructor(
        private readonly executor: CommandQueryExecutorService,
        @Inject(KahootNestMapperAdapter) 
        private readonly kahootMapper: IKahootMapper<CreateKahootDTO, UpdateKahootDTO>
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createKahoot(@Body() input: CreateKahootDTO): Promise<KahootResponseDTO> {
        const command = this.kahootMapper.toCreateCommand(input); 
        return await this.executor.executeCommand<KahootResponseDTO>(command);
    }
    
    @Put(':id') 
    @HttpCode(HttpStatus.OK)
    async replaceKahoot(
        @Param('id') kahootId: string,
        @Body() input: UpdateKahootDTO,
    ): Promise<KahootResponseDTO> {
        const command = this.kahootMapper.toUpdateCommand(input, kahootId);
        return await this.executor.executeCommand<KahootResponseDTO>(command);
    }

    @Get(':id')
    async getKahootById(@Param('id') kahootId: string) {
        const query = new GetKahootByIdQuery(kahootId);
        return await this.executor.executeQueryOptional(
            query, 
            kahootId, 
            'Kahoot'
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    async deleteKahoot(@Param('id') kahootId: string): Promise<void> {
        const command = new DeleteKahootCommand({
            id: kahootId, 
            userId: "placeholder" // TODO: Obtener del token JWT
        });
        
        await this.executor.executeCommand<void>(command);
    }
}