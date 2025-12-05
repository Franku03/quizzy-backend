// src/kahoots/application/commands/create-kahoot/create-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { CreateKahootCommand } from './create-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';
import { KahootFactory, KahootInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { MapperName } from '../../catalogs/catalog.mapper.enum';
import type { IKahootResponseMapper } from '../../ports/i-kahoot.response.mapper';
import { KahootResponseDTO } from '../response-dto/kahoot.response.dto';
import { Either } from 'src/core/types/either';

import { 
  InvalidKahootDataError 
} from '../../../domain/errors/kahoot-domain.errors';
import { CreateKahootError } from '../../errors/kahoot-aplication.errors';

@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand, Either<CreateKahootError, KahootResponseDTO>> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(UuidGenerator)
        private readonly idGenerator: IdGenerator<string>,
        @Inject(MapperName.KahootResponse) 
        private readonly kahootResponseMapper: IKahootResponseMapper,
    ) {}

    async execute(command: CreateKahootCommand): Promise<Either<CreateKahootError, KahootResponseDTO>> {
        try {
            // 1. Crear agregado
            const kahoot = await this.createKahoot(command);
            
            // 2. Guardar
            const saveResult = await this.kahootRepository.saveKahootEither(kahoot);
            if (saveResult.isLeft()) {
                return Either.makeLeft(saveResult.getLeft()); 
            }
            
            // 3. Mapear respuesta
            const response = await this.kahootResponseMapper.toResponseDTO(kahoot);
            return Either.makeRight(response);
            
        } catch (error) {
            return Either.makeLeft({
                type: 'InvalidKahootData',
                message: error instanceof Error ? error.message : 'Error de datos inválidos en kahoot',
                timestamp: new Date(),
                originalError: error,
            } as InvalidKahootDataError);
        }
    }

    private async createKahoot(command: CreateKahootCommand): Promise<Kahoot> {
        const creationDate = new Date().toISOString().split('T')[0];
        const kahootId = await this.idGenerator.generateId();
        
        const slides = await Promise.all(
            (command.slides || []).map(async s => ({
                ...s,
                id: await this.idGenerator.generateId(),
            }))
        );

        const input: KahootInput = {
            id: kahootId,
            ...command,
            slides,
            createdAt: creationDate,
            playCount: 0,
        };
        
        return KahootFactory.createFromRawInput(input);
    }
}