// src/kahoots/infrastructure/controllers/kahoot.controller.ts (VERSIÓN FINAL)

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
  // 💡 No necesitamos importar las excepciones de NestJS gracias al AllExceptionsFilter
} from '@nestjs/common';

import { CreateKahootDTO, UpdateKahootDTO } from '../dtos'; 
import type { IKahootRequestMapper } from 'src/kahoots/application/ports/i-kahoot.request.mapper'; 
import { KahootNestMapperAdapter } from '../adapters/mappers/kahoot.request.mapper';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { DeleteKahootCommand } from 'src/kahoots/application/commands/delete-kahoot/delete-kahootcommand';
import { GetKahootByIdQuery } from 'src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.query';
import { CommandQueryExecutorService } from '../../../core/infrastructure/services/command-query-executor.service'; 
import { MockAuthGuard } from 'src/common/infrastructure/guards/mock-auth-guard';
import { GetUserId } from 'src/common/decorators/get-user-id-decorator';

@Controller('kahoots')
export class KahootController {
  
  // Usamos el ejecutor de la Capa Compartida
  constructor(
    private readonly executor: CommandQueryExecutorService,
    @Inject(KahootNestMapperAdapter) 
    private readonly kahootMapper: IKahootRequestMapper<CreateKahootDTO, UpdateKahootDTO>
  ) {}

  // --- C O M A N D S (Mutación) ---

  @Post()
  @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createKahoot(
    @Body() input: CreateKahootDTO,
    @GetUserId() userId: string
  ): Promise<KahootHandlerResponse> {
    const command = this.kahootMapper.toCreateCommand(input, userId); 
    // Si executeCommand lanza ErrorData (ej. INVALID_DATA), el filtro global lo captura.
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
    // Si executeCommand lanza ErrorData (ej. UNAUTHORIZED, NOT_FOUND), el filtro global lo captura.
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
    // Si executeCommand lanza ErrorData (ej. UNAUTHORIZED, NOT_FOUND), el filtro global lo captura.
    await this.executor.executeCommand<void>(command);
  }
  
  // --- Q U E R I E S (Lectura) ---

  // ✅ Uso de executeQueryRequired (Reemplazo de executeQueryOptional)
  @Get(':id')
   @UseGuards(MockAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getKahootById(
    @Param('id') kahootId: string,
    @GetUserId() userId?: string // Opcional para visibilidad
  ): Promise<KahootHandlerResponse> {
    const query = new GetKahootByIdQuery({kahootId, userId});
    
    // 💡 executeQueryRequired: 
    // 1. Ejecuta la Query.
    // 2. Si el Handler devuelve null, lanza ErrorData(RESOURCE_NOT_FOUND) con el contexto.
    // 3. El filtro global atrapa ese ErrorData y lo convierte a HTTP 404.
    return await this.executor.executeQueryRequired<KahootHandlerResponse>(
        query, 
        kahootId, 
        'Kahoot' // Este valor se usa para el domainObjectType en el ErrorData(NOT_FOUND)
    );
  }
}