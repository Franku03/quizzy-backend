import { Inject } from '@nestjs/common';
import { DeleteKahootCommand } from './delete-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
// Usaremos un tipo de respuesta simple para las eliminaciones

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler implements ICommandHandler<DeleteKahootCommand> {
    
    // Inyectamos el puerto del repositorio
    constructor(
            @Inject(RepositoryName.Kahoot)
            private readonly kahootRepository: IKahootRepository,
            @Inject(RepositoryName.Attempt)
            private readonly attemptRepository: SoloAttemptRepository,
            
    ) {}

    async execute(command: DeleteKahootCommand): Promise<void> {
        
        // 1. Cargar la entidad para verificación de propietario (mínimo de Aggregate)
        const kahootId = new KahootId(command.id) 
        const kahootOptional = await this.kahootRepository.findKahootById(kahootId);

        if (!kahootOptional.hasValue()) {
            throw new Error(`El Kahoot con ID: ${command.id} no fue encontrado.`);
        }
        
        const kahoot: Kahoot = kahootOptional.getValue();

        /*if (kahoot.authorId !== command.userId) {
            throw new UnauthorizedException('Solo el autor puede eliminar este Kahoot.');
        }*/
        await this.kahootRepository.deleteKahoot(kahootId);
        console.log(`
        -----------------------------------------------------
        🗑️ DELETE SUCCESS [Kahoot ID: ${command.id}]
        -----------------------------------------------------
        El objeto Kahoot ha sido eliminado.
        `);
        await this.attemptRepository.deleteAllActiveForKahootId(kahootId);
        // 4. Devolver resultado (vacío, ya que el código HTTP 204 indica éxito en la eliminación)
        return; 
    }
}