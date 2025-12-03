import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Put, Param, Delete, Get, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateKahootDTO, UpdateKahootDTO } from './dtos'; 
import type { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/commands/input/kahoot.request.mapper';
import { KahootResponseDTO } from 'src/kahoots/application/commands/response-dto/kahoot.response.dto';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot.command/delete-kahootcommand';
import { KahootReadModel } from 'src/kahoots/application/queries/read-model/kahoot.response.read.model';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { Optional } from 'src/core/types/optional';

@Controller('kahoots')
export class KahootController {
    constructor(
        private readonly commandBus: CommandBus,
        @Inject(KahootNestMapperAdapter) 
        private readonly kahootMapper: IKahootMapper<CreateKahootDTO, UpdateKahootDTO>, 
        private readonly queryBus: QueryBus
    ) {}
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createKahoot(@Body() input: CreateKahootDTO) {
        const command = this.kahootMapper.toCreateCommand(input); 
        await this.commandBus.execute(command);

        const updatedKahootDTO: KahootResponseDTO = await this.commandBus.execute(command);
        return updatedKahootDTO;
    }
    
    @Put(':id') 
    @HttpCode(HttpStatus.OK)
    async replaceKahoot(
        @Param('id') kahootId: string,
        @Body() input: UpdateKahootDTO,
    ) {
        const command = this.kahootMapper.toUpdateCommand(input, kahootId);
        await this.commandBus.execute(command);

        const updatedKahootDTO: KahootResponseDTO = await this.commandBus.execute(command);
        return updatedKahootDTO;
    }

    @Get(':id')
    async getKahootById(@Param('id') kahootId: string): Promise<KahootReadModel> {
        
        // 1. Crear el objeto Query
        const query = new GetKahootByIdQuery(kahootId);

        // 2. Ejecutar la Query a través del QueryBus
        // El QueryBus devolverá el resultado del QueryHandler, que es Optional<KahootReadModel>
        const optionalKahoot: Optional<KahootReadModel> = await this.queryBus.execute(query);

        // 3. Manejo del resultado
        const kahoot = optionalKahoot.getValue();

        if (!kahoot) {
            throw new NotFoundException(`Kahoot con ID ${kahootId} no encontrado.`);
        }
        return kahoot; 
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    async deleteKahoot(@Param('id') kahootId: string): Promise<void> {
        const command = new DeleteKahootCommand({id: kahootId, userId: "placeholder"});
        await this.commandBus.execute(command);
    
    }
}