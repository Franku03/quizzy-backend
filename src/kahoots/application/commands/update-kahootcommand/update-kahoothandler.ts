import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';
import { KahootFactory, SlideInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { UpdateKahootCommand } from '../update-kahootcommand/update-kahootcommand';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.status';
import { SlideIdValue } from 'src/kahoots/domain/types/id-types';
import { Slide } from 'src/kahoots/domain/entities/kahoot.slide';
import type { IKahootResponseMapper } from '../../ports/i-kahoot.response.mapper'; 
import { KahootResponseDTO } from '../response-dto/kahoot.response.dto'; 
import { MapperName } from '../../catalogs/catalog.mapper.enum'; 
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';


@CommandHandler(UpdateKahootCommand)
// 1. Cambiar el tipo de retorno genérico a KahootResponseDTO
export class UpdateKahootHandler implements ICommandHandler<UpdateKahootCommand, KahootResponseDTO> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(RepositoryName.Attempt)
        private readonly attemptRepository: SoloAttemptRepository,
        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,
        // 2. Inyectar el Mapper de Respuesta
        @Inject(MapperName.KahootResponse)
        private readonly kahootResponseMapper: IKahootResponseMapper,
    ) {}

    // 3. Cambiar el tipo de retorno del método execute
    async execute(command: UpdateKahootCommand): Promise<KahootResponseDTO> {
        
        // 1. Recuperar el agregado existente
        const kahootId = new KahootId(command.id) 
        const kahootOptional = await this.kahootRepository.findKahootById(kahootId);

        // 2. Verificar existencia
        if (!kahootOptional.hasValue()) {
            throw new Error(`El Kahoot con ID: ${command.id} no fue encontrado.`);
        }

        const kahoot: Kahoot = kahootOptional.getValue();

        // 3. Reconstruir KahootDetails (VO Opcional) usando la Factory
        const newDetailsOptional = KahootFactory.assembleKahootDetails(
            command.title, 
            command.description, 
            command.category,
        );
        kahoot.updateDetails(newDetailsOptional.getValue());
        
        // 4. Reconstruir KahootStyling (VO) usando la Factory
        const newStyling = KahootFactory.assembleKahootStyling(
            command.themeId, 
            command.coverImageId
        );
        kahoot.updateStyling(newStyling);
        
        // 5. Actualizar Visibilidad
        const visibilityString = command.visibility;
        if (visibilityString === VisibilityStatusEnum.PUBLIC) {
            kahoot.makePublic();
        } else if (visibilityString === VisibilityStatusEnum.PRIVATE) {
            kahoot.hide();
        }
        
        // 6. Actualizar Slides
        const slidesToReplaceCommands = command.slides ?? [];

        const slidesInputWithIds: SlideInput[] = await Promise.all(
            slidesToReplaceCommands.map(async (slideCommand) => {
                const slideId = slideCommand.id || await this.IdGenerator.generateId();
                return {
                    ...slideCommand, 
                    id: slideId, 
                };
            })
        );
        
        // 7. Actualizar Estatus
        const statusString = command.status;
        if(statusString === KahootStatusEnum.DRAFT) {
            kahoot.draft();
        } else if (statusString === KahootStatusEnum.PUBLISH) {
            kahoot.publish()
        }

        // --- CONSTRUCCIÓN DEL MAP Y REEMPLAZO DIRECTO (Slides) ---
        const newSlides = new Map<SlideIdValue, Slide>();
        slidesInputWithIds.forEach((input) => {
            const newSlide = KahootFactory.buildSlide(input); 
            newSlides.set(newSlide.id.value, newSlide); 
        });
        kahoot.replaceSlides(newSlides); 
        
        // 8. Persistencia
        await this.kahootRepository.saveKahoot(kahoot);
        
        console.log(`Kahoot con ID ${command.id} actualizado exitosamente.`);

        await this.attemptRepository.deleteAllActiveForKahootId(kahootId);
        // 4. Mapear la entidad actualizada a DTO y retornarla
        return this.kahootResponseMapper.toResponseDTO(kahoot);
    }
}