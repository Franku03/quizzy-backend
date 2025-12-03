import { Controller, Post, Body, HttpCode, HttpStatus, Inject, Put, Param, Delete, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateKahootDTO, UpdateKahootDTO } from './dtos/kahoot-input.dto'; 
import type { IKahootMapper } from 'src/kahoots/application/ports/i-kahoot.mapper'; 

const KAHOOT_MAPPER_TOKEN = 'IKahootMapper'; 


@Controller('kahoot')
export class KahootController {
    constructor(
        private readonly commandBus: CommandBus,
        @Inject(KAHOOT_MAPPER_TOKEN) 
        private readonly kahootMapper: IKahootMapper<CreateKahootDTO, UpdateKahootDTO>, 
    ) {}
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createKahoot(@Body() input: CreateKahootDTO) {
        const command = this.kahootMapper.toCreateCommand(input); 
        
        await this.commandBus.execute(command);

        return {
            message: 'Kahoot creado exitosamente'
        };
    }
    
    @Put(':id') 
    @HttpCode(HttpStatus.OK)
    async replaceKahoot(
        @Param('id') kahootId: string,
        @Body() input: UpdateKahootDTO,
    ) {
        const command = this.kahootMapper.toUpdateCommand(input, kahootId);
        await this.commandBus.execute(command);

        return {
            message: `Kahoot con ID ${kahootId} reemplazado exitosamente`
        };
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
    @HttpCode(HttpStatus.NO_CONTENT) // Código 204: Éxito sin contenido de respuesta
    async deleteKahoot(@Param('id') kahootId: string) {
        // Creamos el Command
        //const command = new DeleteKahootCommand(kahootId);
        //await this.commandBus.execute(command);
    }
}