// src/kahoots/application/commands/update-kahoot/update-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { UpdateKahootCommand } from '../update-kahoot/update-kahootcommand';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.status';
import { SlideIdValue } from 'src/kahoots/domain/types/id-types';
import { Slide } from 'src/kahoots/domain/entities/kahoot.slide';
import type { IKahootResponseMapper } from '../../ports/i-kahoot.response.mapper'; 
import { KahootResponseDTO } from '../response-dto/kahoot.response.dto'; 
import { MapperName } from '../../catalogs/catalog.mapper.enum'; 
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';

import { 
  KahootNotFoundError,
  InvalidKahootDataError,
  UnauthorizedError 
} from '../../../domain/errors/kahoot-domain.errors';
import { UpdateKahootError } from '../../errors/kahoot-aplication.errors';


@CommandHandler(UpdateKahootCommand)
export class UpdateKahootHandler implements ICommandHandler<UpdateKahootCommand, Either<UpdateKahootError, KahootResponseDTO>> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(RepositoryName.Attempt)
        private readonly attemptRepository: SoloAttemptRepository,
        @Inject(UuidGenerator)
        private readonly idGenerator: IdGenerator<string>,
        @Inject(MapperName.KahootResponse)
        private readonly kahootResponseMapper: IKahootResponseMapper,
    ) {}

    async execute(command: UpdateKahootCommand): Promise<Either<UpdateKahootError, KahootResponseDTO>> {
        try {
            // 1. Recuperar el agregado existente
            const kahootId = new KahootId(command.id);
            const findResult = await this.kahootRepository.findKahootByIdEither(kahootId);

            if (findResult.isLeft()) {
                return Either.makeLeft(findResult.getLeft());
            }

            const kahootOptional = findResult.getRight();
            if (!kahootOptional.hasValue()) {
                return Either.makeLeft({
                    type: 'KahootNotFound',
                    message: `El Kahoot con ID: ${command.id} no fue encontrado`,
                    kahootId: command.id,
                    timestamp: new Date(),
                } as KahootNotFoundError);
            }

            const kahoot = kahootOptional.getValue();

            // 2. TODO: Verificar autorización cuando se implemente auth
            // Necesito el id del usuario que hizo la petición

            // 3. Aplicar updates
            await this.applyUpdates(kahoot, command);
            
            // 4. Persistencia
            const saveResult = await this.kahootRepository.saveKahootEither(kahoot);
            if (saveResult.isLeft()) {
                return Either.makeLeft(saveResult.getLeft());
            }
            
            console.log(`
            -----------------------------------------------------
            ✅ UPDATE SUCCESS [Kahoot ID: ${command.id}]
            -----------------------------------------------------
            Usuario: ${command.authorId}
            El kahoot ha sido actualizado.
            `);

            // 5. Limpiar intentos activos
            await this.cleanupAttempts(kahootId);

            // 6. Mapear respuesta
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

    private async applyUpdates(kahoot: Kahoot, command: UpdateKahootCommand): Promise<void> {
        // 1. Reconstruir KahootDetails
        const newDetailsOptional = KahootFactory.assembleKahootDetails(
            command.title, 
            command.description, 
            command.category,
        );
        
        if (newDetailsOptional.hasValue()) {
            kahoot.updateDetails(newDetailsOptional.getValue());
        }
        
        // 2. Reconstruir KahootStyling
        const newStyling = KahootFactory.assembleKahootStyling(
            command.themeId, 
            command.coverImageId
        );
        kahoot.updateStyling(newStyling);
        
        // 3. Actualizar Visibilidad
        if (command.visibility === VisibilityStatusEnum.PUBLIC) {
            kahoot.makePublic();
        } else if (command.visibility === VisibilityStatusEnum.PRIVATE) {
            kahoot.hide();
        }
        // 4. Reemplazar Slides
        const slidesToReplaceCommands = command.slides ?? [];
        
        if (slidesToReplaceCommands.length > 0) {
            const slidesInputWithIds: SlideInput[] = await Promise.all(
                slidesToReplaceCommands.map(async (slideCommand) => {
                    const slideId = slideCommand.id || await this.idGenerator.generateId();
                    return {
                        ...slideCommand, 
                        id: slideId, 
                    } as SlideInput;
                })
            );
            
            const newSlides = new Map<SlideIdValue, Slide>();
            slidesInputWithIds.forEach((input) => {
                const newSlide = KahootFactory.buildSlide(input); 
                newSlides.set(newSlide.id.value, newSlide); 
            });
            kahoot.replaceSlides(newSlides); 
        }
        
        // 5. Actualizar Estatus
        if (command.status === KahootStatusEnum.DRAFT) {
            kahoot.draft();
        } else if (command.status === KahootStatusEnum.PUBLISH) {
            kahoot.publish();
        }
    }

    private async cleanupAttempts(kahootId: KahootId): Promise<void> {
        try {
            await this.attemptRepository.deleteAllActiveForKahootId(kahootId);
        } catch (error) {
            console.warn(`No se pudieron limpiar intentos:`, error);
        }
    }
}