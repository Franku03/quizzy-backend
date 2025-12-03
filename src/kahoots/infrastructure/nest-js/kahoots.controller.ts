import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Put, Param, Delete, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateKahootDTO, UpdateKahootDTO } from './dtos'; 
import type { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/input/kahoot.request.mapper';
import { KahootResponseDTO } from 'src/kahoots/application/response-dto/kahoot.response.dto';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot.command/delete-kahootcommand';

@Controller('kahoots')
export class KahootController {
    constructor(
        private readonly commandBus: CommandBus,
        @Inject(KahootNestMapperAdapter) 
        private readonly kahootMapper: IKahootMapper<CreateKahootDTO, UpdateKahootDTO>, 
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
    async getKahootById(@Param('id') kahootId: string) {
        // Creamos el objeto Query
        /*const query = new GetKahootByIdQuery(kahootId);

        // Ejecutamos la Query y devolvemos el resultado directamente
        const kahoot = await this.queryBus.execute(query);*/

        // Si la Query devuelve un DTO de lectura (Read Model), lo retornamos.
        //return kahoot; 
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT) 
    async deleteKahoot(@Param('id') kahootId: string): Promise<void> {
        console.log("xd")
        const command = new DeleteKahootCommand({id: kahootId, userId: "placeholder"});
        await this.commandBus.execute(command);
    
    }
}