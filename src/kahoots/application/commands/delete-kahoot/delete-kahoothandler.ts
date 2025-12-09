// src/kahoots/application/commands/delete-kahoot/delete-kahoot.handler.ts
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { DeleteKahootCommand } from "../../commands";
import { Inject, Logger } from "@nestjs/common"; 
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";

// Importaciones Universales
import { Either, ErrorData, ErrorLayer } from "src/core/types"; 
import { createDomainContext } from "src/core/errors/helpers/domain-error-context.helper";

// Puertos y Servicios
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { AttemptCleanupService } from "../../services/attempt-clear.service";
import { KahootAuthorizationService } from "../../services/kahoot-athorization.service";

// Catálogos
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler
    implements ICommandHandler<DeleteKahootCommand, Either<ErrorData, void>> {

    private readonly logger = new Logger(DeleteKahootHandler.name);

    constructor(
        @Inject(RepositoryName.Kahoot)
        private readonly kahootRepository: IKahootRepository,
        private readonly attemptCleanup: AttemptCleanupService,
        private readonly authService: KahootAuthorizationService
    ) { }

    async execute(command: DeleteKahootCommand): Promise<Either<ErrorData, void>> {
        // Contexto base para errores
        const errorContext = createDomainContext('Kahoot', 'deleteKahoot', {
            domainObjectId: command.id,
            actorId: command.userId,
            userId: command.userId,
            intendedAction: 'delete',
        });

        try {
            // 1. Obtener kahoot con validación de autorización
            const authResult = await this.authService.getKahootForDelete(command.id, command.userId);

            if (authResult.isLeft()) {
                return Either.makeLeft(authResult.getLeft());
            }

            // 2. Eliminar del repositorio
            const deleteResult = await this.kahootRepository.deleteKahootEither(command.id);

            if (deleteResult.isLeft()) {
                return Either.makeLeft(deleteResult.getLeft());
            }

            // 3. Limpiar intentos (fire-and-forget)
            try {
                await this.attemptCleanup.cleanupById(new KahootId(command.id));
            } catch (cleanupError) {
                this.logger.warn(`Failed to cleanup attempts for deleted kahoot ${command.id}`, cleanupError);
                // No bloquea la eliminación principal
            }

            return Either.makeRight(undefined);

        } catch (error) {
            // Manejo de errores específicos
            if (error instanceof ErrorData) {
                return Either.makeLeft(error);
            }

            // Error inesperado de aplicación
            const unexpectedError = new ErrorData(
                "APPLICATION_UNEXPECTED_ERROR",
                `Unexpected error during deletion: ${error instanceof Error ? error.message : String(error)}`,
                ErrorLayer.APPLICATION,
                errorContext,
                error as Error
            );
            return Either.makeLeft(unexpectedError);
        }
    }
}