// src/kahoots/application/queries/get-kahoot-by-id.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IKahootDao } from '../ports/kahoot.dao.port';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { Either } from 'src/core/types/either';
import { GetKahootByIdError } from '../../errors/kahoot-aplication.errors';
import { KahootHandlerResponse } from '../../response/kahoot.handler.response';
import { KahootErrorMapper } from '../../errors/kahoot-error.mapper';
import { VisibilityStatusEnum } from 'src/kahoots/domain/value-objects/kahoot.visibility-status';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler 
  implements IQueryHandler<GetKahootByIdQuery, Either<GetKahootByIdError, KahootHandlerResponse>> {
  
  constructor(
    @Inject(DaoName.Kahoot)
    private readonly kahootDao: IKahootDao
  ) {}

  async execute(query: GetKahootByIdQuery): Promise<Either<GetKahootByIdError, KahootHandlerResponse>> {
    try {
      // 1. Obtener kahoot del DAO
      const result = await this.kahootDao.getKahootById(query.kahootId);

      if (result.isLeft()) {
        const repoError = result.getLeft();
        return Either.makeLeft(
          KahootErrorMapper.fromInfrastructure(
            repoError,
            'getById',
            { kahootId: query.kahootId, userId: query.userId }
          ) as GetKahootByIdError
        );
      }

      const optionalKahoot = result.getRight();

      if (!optionalKahoot.hasValue()) {
        return Either.makeLeft(
          KahootErrorMapper.fromDomain(
            { type: 'KahootNotFound', message: `Kahoot with ID ${query.kahootId} not found` },
            'getById',
            { kahootId: query.kahootId, userId: query.userId }
          ) as GetKahootByIdError
        );
      }

      const kahoot = optionalKahoot.getValue();
      
      // 2. Validar permisos directamente en el handler
      const isPublic = kahoot.visibility === VisibilityStatusEnum.PUBLIC;
      const isOwner = kahoot.authorId === query.userId;

      // Usuario no autenticado o sin permisos
      if (!isPublic && !isOwner) {
        return Either.makeLeft(
          KahootErrorMapper.fromDomain(
            { 
              type: 'UnauthorizedKahoot', 
              message: `You don't have permission to view this kahoot` 
            },
            'getById',
            { 
              kahootId: query.kahootId, 
              userId: query.userId,
              isPublic,
              isOwner
            }
          ) as GetKahootByIdError
        );
      }

      return Either.makeRight(kahoot);
      
    } catch (error) {
      return Either.makeLeft(
        KahootErrorMapper.fromAny(
          error,
          'getById',
          { kahootId: query.kahootId, userId: query.userId }
        ) as GetKahootByIdError
      );
    }
  }
}