// src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.handler.ts
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';

// Core & Types
import { Either, ErrorData } from 'src/core/types';
import { pipeAsync } from 'src/core/errors/helpers/pipe-async';
import { MAPPER_TOKEN } from 'src/core/application/mapper/i-mapper.token';

// Response & Media
import { KahootHandlerResponseDto } from '../../dtos/kahoot.handler.response.dto';
import { MediaEnrichmentService } from 'src/media/application/facade/media-enrichment.service';

// Infraestructura
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import type { IKahootDao } from '../../ports/i-kahoot.dao.interface';

//Mapper
import type { IMapper } from 'src/core/application/mapper/i-mapper.interface';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery> {

  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao,

    @Inject(MAPPER_TOKEN)
    private readonly mapper: IMapper<KahootSnapshot, KahootHandlerResponseDto>,

    private readonly mediaService: MediaEnrichmentService,
  ) { }

  async execute(query: GetKahootByIdQuery): Promise<Either<ErrorData, KahootHandlerResponseDto>> {

    return pipeAsync(
      // 1. Infraestructura: Obtener Snapshot Raw del DAO
      this.kahootDao.getKahootById(query.kahootId),

      // 2. Enriquecimiento: Snapshot (ID) -> Snapshot (URL)
      // Usamos el operador '!' asumiendo tu regla de "no es null"
      res => res.mapAsync(snapshot => this.mediaService.enrichKahoot(snapshot!)),

      // 3. Mapeo: Snapshot -> DTO Response
      res => res.map(snapshot => this.mapper.map(snapshot!))
    );
  }
}