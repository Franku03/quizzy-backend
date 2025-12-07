import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteKahootCommand } from "./delete-kahootcommand";
import { Either } from "src/core/types/either";
import { DeleteKahootError } from "../../errors/kahoot-aplication.errors";
import { AttemptCleanupService } from "../../services/attempt-clear.service";
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { Inject } from "@nestjs/common";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";
import { KahootErrorMapper } from "../../errors/kahoot-error.mapper";
import { KahootNotFoundError, UnauthorizedKahootError } from "src/kahoots/domain/errors/kahoot-domain.errors";
import { KahootAuthorizationService } from "../../services/kahoot-athorization.service";

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler 
  implements ICommandHandler<DeleteKahootCommand, Either<DeleteKahootError, void>> {
    
    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        private readonly attemptCleanup: AttemptCleanupService,
        private readonly authService: KahootAuthorizationService
    ) {}

    async execute(command: DeleteKahootCommand): Promise<Either<DeleteKahootError, void>> {
        try {
            // 1. Obtener kahoot con validación de autorización
            const authResult = await this.authService.getKahootForDelete(command.id, command.userId);
            
            if (authResult.isLeft()) {
                const domainError = authResult.getLeft();
                return Either.makeLeft(
                    KahootErrorMapper.fromDomain(
                        domainError,
                        'delete',
                        { kahootId: command.id, userId: command.userId }
                    ) as DeleteKahootError
                );
            }

            const kahoot = authResult.getRight();

            // 2. Eliminar del repositorio
            const deleteResult = await this.kahootRepository.deleteKahootEither(
                new KahootId(command.id)
            );
            
            if (deleteResult.isLeft()) {
                const infraError = deleteResult.getLeft();
                return Either.makeLeft(
                    KahootErrorMapper.fromInfrastructure(
                        infraError,
                        'delete',
                        { 
                            kahootId: command.id, 
                            userId: command.userId,
                            kahootAuthorId: kahoot.authorId
                        }
                    ) as DeleteKahootError
                );
            }

            // 3. Limpiar intentos
            await this.attemptCleanup.cleanupById(new KahootId(command.id));
            
            return Either.makeRight(undefined);
            
        } catch (error) {
            return Either.makeLeft(
                KahootErrorMapper.fromAny(error, 'delete', { 
                    kahootId: command.id, 
                    userId: command.userId 
                }) as DeleteKahootError
            );
        }
    }
}