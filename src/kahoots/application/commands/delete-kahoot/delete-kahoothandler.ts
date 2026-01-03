// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { CommandHandler } from 'src/core/infrastructure/cqrs/decorators/command-handler.decorator';
import { ICommandHandler } from 'src/core/application/cqrs/command-handler.interface';

// --- Core Logic & Errors ---
import { Either, ErrorData }  from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';

// --- Domain & Persistence ---
import type { IKahootRepository } from "src/kahoots/domain/ports/IKahootRepository";
import { KahootId } from "src/core/domain/shared-value-objects/id-objects/kahoot.id";
import { RepositoryName } from "src/database/infrastructure/catalogs/repository.catalog.enum";

// --- Application Services ---
import { DeleteKahootCommand } from "../../commands";
import { AttemptCleanupService } from "../../services/attempt-clear.service";
import { createKahootAppContext } from '../base/base-kahoot-context';

@CommandHandler(DeleteKahootCommand)
export class DeleteKahootHandler implements ICommandHandler<DeleteKahootCommand> {

  constructor(
    @Inject(RepositoryName.Kahoot)
    private readonly kahootRepository: IKahootRepository,
    private readonly attemptCleanup: AttemptCleanupService,
  ) { }

async execute(command: DeleteKahootCommand): Promise<Either<ErrorData, void>> {
    // El Aspect ya validó que el recurso existe y el usuario tiene permiso.
    
    return pipeAsync(
      // 1. Persistencia: Borrado físico o lógico
      this.kahootRepository.deleteKahootEither(command.id),

      // 2. Aplicación: Contexto mínimo por si falla la base de datos (Infra)
      k => k.mapLeft(err => err.setContext(createKahootAppContext('deleteKahoot', command.id))),

      // 3. Side Effect: Limpieza asíncrona
      k => k.tapChainAsync(async () => {
        await this.attemptCleanup
          .cleanupById(new KahootId(command.id))
          .catch(() => null); // Silenciamos fallos de limpieza
        return Either.makeRight(undefined);
      })
    );
  }
}