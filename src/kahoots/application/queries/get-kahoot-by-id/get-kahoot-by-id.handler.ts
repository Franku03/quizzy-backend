// src/kahoots/application/queries/get-kahoot-by-id.handler.ts
import { IQueryHandler } from 'src/core/application/cqrs/query-handler.interface';
import { QueryHandler } from 'src/core/infrastructure/cqrs/decorators/query-handler.decorator';
import { Inject } from '@nestjs/common';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';

// Importaciones Universales y de Core
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { DomainErrorFactory } from 'src/core/errors/factories/domain-error.factory';
import { createDomainContext } from 'src/core/errors/helpers/domain-error-context.helper';

// Servicios y Puertos
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import type { IKahootDao } from '../../ports/kahoot.dao.port';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';
import { KahootAssetEnricherService } from '../../services/kahoot-asset-enricher.service';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler

            // IQueryHandler<GetKahootByIdQuery, Either<ErrorData, KahootHandlerResponse>>
  implements IQueryHandler<GetKahootByIdQuery> {

  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao,
    @Inject(KahootAssetEnricherService)
    private readonly assetEnricher: KahootAssetEnricherService,
  ) { }

  async execute(query: GetKahootByIdQuery): Promise<Either<ErrorData, KahootHandlerResponse>> {

    // Contexto base para errores del dominio
    const errorContext = createDomainContext('Kahoot', 'getKahootById', {
      domainObjectId: query.kahootId,
      actorId: query.userId,
      userId: query.userId,
      intendedAction: 'read', 
    });

    try {
      // Obtener kahoot del DAO
      const result = await this.kahootDao.getKahootById(query.kahootId);
      
      // Manejar error de Infraestructura
      if (result.isLeft()) {
        return Either.makeLeft(result.getLeft());
      }

      const kahootOrNull = result.getRight(); 

      // Manejar "No encontrado"
      if (kahootOrNull === null) {
        return Either.makeLeft(DomainErrorFactory.notFound(errorContext));
      }

      const kahoot = kahootOrNull; 

      // Validar permisos de lectura
      const isPublic = kahoot.visibility === VisibilityStatusEnum.PUBLIC;
      const isOwner = kahoot.authorId === query.userId;

      if (!isPublic && !isOwner) {
        return Either.makeLeft(
          DomainErrorFactory.unauthorized(errorContext)
        );
      }

      // Enriquecer con assets
      const enrichedResponse = await this.assetEnricher.enrich(kahoot);
      
      return Either.makeRight(enrichedResponse);

    } catch (error) {
      if (error instanceof ErrorData) {
        return Either.makeLeft(error);
      }

      // Error inesperado de aplicación
      const unexpectedError = new ErrorData(
        "APPLICATION_UNEXPECTED_ERROR",
        `Unexpected error in Kahoot query: ${error instanceof Error ? error.message : String(error)}`,
        ErrorLayer.APPLICATION,
        errorContext,
        error as Error
      );
      return Either.makeLeft(unexpectedError);
    }
  }
}