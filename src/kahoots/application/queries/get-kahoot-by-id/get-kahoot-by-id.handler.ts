// src/kahoots/application/queries/get-kahoot-by-id/get-kahoot-by-id.handler.ts

import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';

// Core & Types
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

// Response & Media (PUERTOS)
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import type { IMediaEnricher } from '../../ports/i-media-enricher.interface';
import { KAHOOT_MEDIA_ENRICHER } from '../../dependency-tokkens/application-kahoot.tokens'; // Tu Token Symbol

// Infraestructura & Dominio
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import type { IKahootDao } from '../../ports/kahoot.dao.port';
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery> {

  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao,
  
    @Inject(KAHOOT_MEDIA_ENRICHER)
    private readonly mediaEnricher: IMediaEnricher<KahootHandlerResponse>,
  ) { }

  async execute(query: GetKahootByIdQuery): Promise<Either<ErrorData, KahootHandlerResponse>> {
    const errorContext = createDomainContext('Kahoot', 'getKahootById', {
      domainObjectId: query.kahootId,
      actorId: query.userId,
      intendedAction: 'read', 
    });

    try {
      // 1. Obtener datos del DAO (Lectura optimizada)
      const result = await this.kahootDao.getKahootById(query.kahootId);
      
      if (result.isLeft()) return Either.makeLeft(result.getLeft());

      const kahoot = result.getRight(); 

      // 2. Manejar "No encontrado"
      if (!kahoot) {
        return Either.makeLeft(DomainErrorFactory.notFound(errorContext));
      }

      // 3. Validar permisos de lectura (Lógica de Query)
      const isPublic = kahoot.visibility === VisibilityStatusEnum.PUBLIC;
      const isOwner = kahoot.authorId === query.userId;

      if (!isPublic && !isOwner) {
        return Either.makeLeft(DomainErrorFactory.unauthorized(errorContext));
      }

      const enrichedResponse = await this.mediaEnricher.enrich(kahoot);
      
      return Either.makeRight(enrichedResponse);

    } catch (error) {
      return Either.makeLeft(this.handleError(error, errorContext));
    }
  }

  private handleError(error: any, context: any): ErrorData {
    if (error instanceof ErrorData) return error;

    return new ErrorData(
      "APPLICATION_UNEXPECTED_ERROR",
      `Unexpected error in Kahoot query: ${error instanceof Error ? error.message : String(error)}`,
      ErrorLayer.APPLICATION,
      context,
      error as Error
    );
  }
}