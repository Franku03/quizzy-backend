// --- Nest & CQRS ---
import { Inject } from '@nestjs/common';
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';

// --- Core Logic & Errors ---
import { Either, ErrorData } from "src/core/types";
import { pipeAsync } from "src/core/errors/helpers/pipe-async";

// --- Aspects & Decorators ---
import { Log } from "src/core/application/aspects/logging/log.decorator";
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';
import { LOGGER_TOKEN } from "src/core/application/aspects/logging/logger.token";
import type { ILogger } from "src/core/application/aspects/logging/logger.interface";

// --- Auth Strategies ---
import {
  KahootOwnershipAuthorizer,
  IKahootOwnershipRequest
} from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';

// --- Domain Snapshots ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// --- Infrastructure & DAOs ---
import { DaoName } from "src/database/infrastructure/catalogs/dao.catalog.enum";
import type { IKahootDao } from "../../ports/i-kahoot.dao.interface";
import type { ISoloAttemptQueryDao } from 'src/solo-attempts/application/queries/ports/attempts.dao.port';
import type { IUserDao } from "src/users/application/queries/ports/users.dao.port";

// --- Application Services, DTOs & Queries ---
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { GetKahootPreviewQuery } from "./get-kahoot-preview-by-id.query";
import { KahootPreviewResponseDto } from "../../dtos/kahoot.preview.response.dto";

/*@QueryHandler(GetKahootPreviewQuery)
export class GetKahootPreviewHandler implements IQueryHandler<GetKahootPreviewQuery> {

  constructor(
    @Inject(DaoName.Kahoot) private readonly kahootDao: IKahootDao,
    // Usamos el puerto que me pasaste: ISoloAttemptQueryDao
    @Inject(DaoName.AssetMetadataMongo) private readonly attemptDao: ISoloAttemptQueryDao,
    @Inject(DaoName.User) private readonly userRouter: IUserDao,
    private readonly mediaService: MediaEnrichmentService,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) { }

  @Log()
  @Authorize(KahootOwnershipAuthorizer, 'kahootDao')
  async execute(
    query: GetKahootPreviewQuery & IKahootOwnershipRequest
  ): Promise<Either<ErrorData, KahootPreviewResponseDto>> {
    
    const { userId } = query;
    const kahootSnapshot = query.validatedResource as KahootSnapshot;

    return pipeAsync<ErrorData, KahootPreviewResponseDto>(
      // 1. Empezamos con el Kahoot validado
      Either.makeRight(kahootSnapshot),

      // 2. Enriquecemos multimedia (Retorna Promise<Either>)
      snapshot => snapshot.mapAsync(s => this.mediaService.enrichKahoot(s)),

      // 3. Orquestación: Combinamos con Intentos y Usuario
      // Confiamos en que los DAOs devuelven Either o valores controlados
      async res => {
        const snapshot = res.getRight();

        // Consultas paralelas
        const [attemptOpt, authorName] = await Promise.all([
          this.attemptDao.findLastAttemptByPlayer(userId, snapshot.id), // Asumiendo este método en tu DAO
          this.userRouter.findUserNameById(snapshot.authorId)
        ]);

        const lastAttempt = attemptOpt.isSome() ? attemptOpt.unwrap() : null;

        const isCompleted = lastAttempt?.status === 'completed';
        const isInProgress = lastAttempt?.status === 'in_progress';

        const response: KahootPreviewResponseDto = {
          id: snapshot.id,
          title: snapshot.title,
          description: snapshot.description,
          coverImageId: snapshot.coverImageId,
          visibility: snapshot.visibility as any,
          themeId: snapshot.themeId,
          author: { 
            id: snapshot.authorId, 
            name: authorName || 'Usuario Desconocido' 
          },
          createdAt: snapshot.createdAt,
          playCount: snapshot.playCount,
          category: snapshot.category,
          status: snapshot.status as any,
          isInProgress: isInProgress,
          isCompleted: isCompleted,
          isFavorite: false, 
        };

        if (lastAttempt && (isInProgress || isCompleted)) {
          response.gameState = {
            attemptId: lastAttempt.id,
            currentScore: lastAttempt.totalScore,
            currentSlide: lastAttempt.questionsAnswered,
            totalSlides: snapshot.questions?.length || 0,
            lastPlayedAt: lastAttempt.updatedAt
          };
        }

        return Either.makeRight(response);
      }
    );
  }
}*/