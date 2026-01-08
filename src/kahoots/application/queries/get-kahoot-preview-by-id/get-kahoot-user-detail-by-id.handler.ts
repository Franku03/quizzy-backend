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


// --- Application Services, DTOs & Queries ---
import { MediaEnrichmentService } from "src/media/application/facade/media-enrichment.service";
import { GetKahootUserDetailById } from "./get-kahoot-user-detail-by-id.query";
import { KahootUserDetailReadModel } from '../../dtos/kahoot-user-detail.read.model.dto';
import { KahootUserDetailAuthorizer } from 'src/core/application/aspects/auth/strategies/kahoot-user-detail.strategy';

@QueryHandler(GetKahootUserDetailById)
export class GetKahootUserDetailHandler implements IQueryHandler<GetKahootUserDetailById> {

  constructor(
    private readonly mediaService: MediaEnrichmentService,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) { }

  @Log()
  @Authorize(KahootUserDetailAuthorizer, 'kahootDao')
  async execute(
    query: GetKahootUserDetailById & { validatedResource: KahootUserDetailReadModel }
  ): Promise<Either<ErrorData, KahootUserDetailReadModel>> {

    return pipeAsync<ErrorData, KahootUserDetailReadModel>(
      // 1. PERFORMANCE: Usamos el ReadModel ya inyectado (traído y mapeado por el Aspect)
      Either.makeRight(query.validatedResource),

      // 2. Enriquecimiento: Firmamos las URLs de los assets multimedia
      // Usamos mapAsync para mantener la estructura del "tren" Either
      either => either.mapAsync(async (readModel) => {
        await this.mediaService.enrich(readModel);
        return readModel;
      })


    );
  }
}