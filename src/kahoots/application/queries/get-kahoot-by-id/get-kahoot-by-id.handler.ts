import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';

// Core & Types
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';

// Response & Media (PUERTOS)
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';
import { KAHOOT_MEDIA_ENRICHER } from '../../dependency-tokkens/application-kahoot.tokens';

// Infraestructura
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import type { IKahootDao } from '../../ports/kahoot.dao.port';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery> {

  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao,

    @Inject(KAHOOT_MEDIA_ENRICHER)
    private readonly mediaEnricher: IMediaEnricher<KahootHandlerResponse>,
  ) { }

  async execute(query: GetKahootByIdQuery): Promise<Either<ErrorData, KahootHandlerResponse>> {

    return pipeAsync(
      // 1. Infraestructura: Obtener DTO desde el DAO (Vía inicial - devuelve Promise<Either>)
      this.kahootDao.getKahootById(query.kahootId),

      // 2. Post-procesamiento: Hidratación multimedia (Usamos mapAsync para la promesa del enriquecedor)
      k => k.mapAsync(dto => this.mediaEnricher.enrich(dto))
    );
  }
}