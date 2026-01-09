/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\kahoots\application\queries\get-kahoot-by-id\get-kahoot-by-id.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';

// Core & Types
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';


// --- Aspects & Decorators ---
import { Log } from 'src/core/application/aspects/logging/log.decorator';
import type { ILogger } from 'src/core/application/aspects/logging/logger.interface';
import { Authorize } from 'src/core/application/aspects/auth/authorization.decorator';

// Importamos la estrategia y su interfaz de request para el tipado del "testigo"
import {
  KahootOwnershipAuthorizer,
  IKahootOwnershipRequest
} from 'src/core/application/aspects/auth/strategies/kahootOwnership.strategy';

// Response & Media
import { KahootHandlerResponseDto } from '../../dtos/kahoot.handler.response.dto';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

// Infraestructura
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import type { IKahootDao } from '../../ports/i-kahoot.dao.interface';

// Mapper
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';


@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery> {

  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.RESPONSE_MAPPER)
    private readonly mapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,

    private readonly mediaService: MediaEnrichmentService,

    @Inject(APPLICATION_CORE_TOKENS.UTILS.LOGGER) private readonly logger: ILogger,
  ) { }

  @Log()
  @Authorize(KahootOwnershipAuthorizer, 'kahootDao')
  async execute(
    query: GetKahootByIdQuery & IKahootOwnershipRequest
  ): Promise<Either<ErrorData, KahootHandlerResponseDto>> {

    return pipeAsync<ErrorData, KahootHandlerResponseDto>(
      // 1. PERFORMANCE: Usamos directamente el Snapshot inyectado por el Authorizer
      Either.makeRight(query.validatedResource as KahootSnapshot),

      // 2. Enriquecimiento: Ya no necesitamos
      res => res.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot)),

      // 3. Mapeo final a DTO
      res => res.map(snapshot => this.mapper.map(snapshot))
    );
  }
}