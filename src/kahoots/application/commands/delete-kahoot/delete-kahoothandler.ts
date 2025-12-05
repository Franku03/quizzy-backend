// src/kahoots/application/commands/delete-kahoot/delete-kahoot.handler.ts
import { Inject } from '@nestjs/common';
import { DeleteKahootCommand } from './delete-kahootcommand';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import type { SoloAttemptRepository } from 'src/solo-attempts/domain/ports/attempt.repository.port';
import type { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Either } from 'src/core/types/either';

import { 
  KahootNotFoundError,
  UnauthorizedError 
} from '../../../domain/errors/kahoot-domain.errors';
import { DeleteKahootError } from '../../errors/kahoot-aplication.errors';

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler implements ICommandHandler<DeleteKahootCommand, Either<DeleteKahootError, void>> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        @Inject(RepositoryName.Attempt)
        private readonly attemptRepository: SoloAttemptRepository,
    ) {}

    async execute(command: DeleteKahootCommand): Promise<Either<DeleteKahootError, void>> {
        try {
            const kahootId = new KahootId(command.id);
            
            // 1. Verificar existencia
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

            // 2. TODO: Verificar permisos cuando se implemente auth

            // 3. Eliminar kahoot
            const deleteResult = await this.kahootRepository.deleteKahootEither(kahootId);
            if (deleteResult.isLeft()) {
                return Either.makeLeft(deleteResult.getLeft());
            }

            console.log(`
            -----------------------------------------------------
            🗑️ DELETE SUCCESS [Kahoot ID: ${command.id}]
            -----------------------------------------------------
            El objeto Kahoot ha sido eliminado.
            `);

            // 4. Limpiar intentos (operación secundaria)
            await this.cleanupAttempts(kahootId);

            return Either.makeRight(undefined);

        } catch (error) {
            // Cualquier error inesperado se maneja aquí
            return Either.makeLeft({
                type: 'UnexpectedError',
                message: error instanceof Error ? error.message : 'Error inesperado eliminando kahoot',
                timestamp: new Date(),
                originalError: error,
            } as DeleteKahootError);
        }
    }

    private async cleanupAttempts(kahootId: KahootId): Promise<void> {
        try {
            await this.attemptRepository.deleteAllActiveForKahootId(kahootId);
        } catch (error) {
            console.warn(`No se pudieron limpiar intentos para kahoot ${kahootId.value}:`, error);
        }
    }
}