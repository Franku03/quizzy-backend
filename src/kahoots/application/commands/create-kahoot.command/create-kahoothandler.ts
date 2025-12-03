import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { CreateKahootCommand } from './create-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';

import { KahootFactory, KahootInput, SlideInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';


@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        
    ) {}

     async execute(command: CreateKahootCommand): Promise<void> {
        
        let idGenerator: IdGenerator<string> = new UuidGenerator();

        // Generar la marca de tiempo de creación en formato ISO 8601 string
        const creationDateString = new Date().toISOString().split('T')[0]; 

        // 1. Generar ID Único para el Agregado Raíz (Kahoot)
        const generatedKahootId = await idGenerator.generateId();
        
        // 2. Mapear y Generar IDs para cada Slide
        const slidesInput: SlideInput[] | undefined = await Promise.all(
            command.slides?.map(async (slideCommand) => {
                const slideId = await idGenerator.generateId();
                // Opcional: Si necesitas generar IDs también para las opciones (answers) aquí lo harías
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
            id: generatedKahootId, // ID del Kahoot
            ...rest, 
            slides: slidesInput, // Array de Slides ahora con IDs
            // 4. INCLUIR EL CAMPO GENERADO POR EL SERVIDOR AQUÍ:
            createdAt: creationDateString, 
        };
        
        console.log(rawInput)

        //5. Aplicar la lógica de Dominio: Crear el Agregado
        const kahoot: Kahoot = KahootFactory.createFromRawInput(rawInput);

        // 6. Persistencia
        //await this.kahootRepository.saveKahoot(kahoot);*/
    }
}