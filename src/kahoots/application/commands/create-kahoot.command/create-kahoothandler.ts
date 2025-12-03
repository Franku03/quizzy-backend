import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { CreateKahootCommand } from './create-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { Inject } from '@nestjs/common';

import { KahootFactory, KahootInput } from '../../../domain/factories/kahoot.factory'; 
import { Kahoot } from '../../../domain/aggregates/kahoot'; 
import type { IdGenerator } from 'src/core/application/idgenerator/id.generator';


@CommandHandler(CreateKahootCommand)
export class CreateKahootHandler implements ICommandHandler<CreateKahootCommand> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        private readonly idGenerator: IdGenerator<string>,
    ) {}

    async execute(command: CreateKahootCommand): Promise<void> {
        
        // 1. Generar ID Único
        const generatedId = await this.idGenerator.generateId();
        
        // 2. Construir el objeto de entrada tipado (KahootInput)
        // El Command ya es un objeto de propiedades inmutables, lo desestructuramos.
        const { 
            authorId, createdAt, visibility, status, playCount, themeId, 
            coverImageId, title, description, category, slides 
        } = command;

        /*const rawInput: KahootInput = {
            id: generatedId,
            authorId: authorId,
            
            // Asumimos que la Factoría maneja la transformación de Date a string si es necesario, 
            // o ajustamos la Factoría para aceptar un objeto Date.
            // Si la Factoría espera string, usamos .toISOString():
            createdAt: (createdAt as Date).toISOString(), 
            
            visibility: visibility,
            status: status,
            playCount: playCount,
            
            themeId: themeId,
            coverImageId: coverImageId,
            title: title,
            description: description,
            category: category,
            slides: slides,
        };
        
        // 3. Aplicar la lógica de Dominio: Crear el Agregado usando la Factoría
        // Ahora, el argumento rawInput coincide con el tipo KahootInput.
        const kahoot: Kahoot = KahootFactory.createFromRawInput(rawInput);

        // 4. Persistencia
        await this.kahootRepository.saveKahoot(kahoot);*/
    }
}