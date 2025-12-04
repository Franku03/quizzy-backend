import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { CreateKahootCommand } from './create-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';
import { KahootFactory, KahootInput, SlideInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { MapperName } from '../../catalogs/catalog.mapper.enum';
import type { IKahootResponseMapper } from '../../ports/i-kahoot.response.mapper';
import { KahootResponseDTO } from '../response-dto/kahoot.response.dto';


@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand, KahootResponseDTO> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject( UuidGenerator )
        private readonly IdGenerator: IdGenerator<string>,
        @Inject(MapperName.KahootResponse) 
        private readonly kahootResponseMapper: IKahootResponseMapper,
        
    ) {}

     async execute(command: CreateKahootCommand): Promise<KahootResponseDTO> {
        

        const creationDateString = new Date().toISOString().split('T')[0]; 

        // 1. Generar ID Único para el Agregado Raíz (Kahoot)
        const generatedKahootId = await this.IdGenerator.generateId();
        
        // 2. Mapear y Generar IDs para cada Slide
        const slidesInput: SlideInput[] | undefined = await Promise.all(
            command.slides?.map(async (slideCommand) => {
                const slideId = await this.IdGenerator.generateId();
                return {
                    ...slideCommand, 
                    id: slideId, 
                };
            }) || []
        );

        // 3. Construir el objeto de entrada rawInput
        // Usamos destructuring para tomar todos los campos del comando
        const { slides, ...rest } = command; 

        const rawInput: KahootInput = {
            id: generatedKahootId, 
            ...rest, 
            slides: slidesInput, // Array de Slides ahora con IDs
            // 4. INCLUIR EL CAMPO GENERADO POR EL BACK
            createdAt: creationDateString,
            playCount: 0,
        };
        
        //5. Aplicar la lógica de Dominio: Crear el Agregado
        const kahoot: Kahoot = KahootFactory.createFromRawInput(rawInput);
        // 6. Persistencia
        await this.kahootRepository.saveKahoot(kahoot);
        console.log(`
        -----------------------------------------------------
        🙌 CREATE SUCCESS [Kahoot ID: ${kahoot.id.value}]
        -----------------------------------------------------
        El nuevo Kahoot ha sido creado.
        `);
        return this.kahootResponseMapper.toResponseDTO(kahoot);

    }
}