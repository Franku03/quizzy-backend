// src/kahoots/application/queries/get-kahoot-by-id.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IKahootDao } from '../ports/kahoot.dao.port';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { KahootReadModel } from '../read-model/kahoot.response.read.model';
import { Either } from 'src/core/types/either';
import { GetKahootByIdError } from '../../errors/kahoot-aplication.errors';
import { Optional } from 'src/core/types/optional';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery, Either<GetKahootByIdError, Optional<KahootReadModel>>> {  // <-- Cambiar aquí
  
  constructor(
    @Inject(DaoName.Kahoot) 
    private readonly kahootDao: IKahootDao
  ) {}

  async execute(query: GetKahootByIdQuery): Promise<Either<GetKahootByIdError, Optional<KahootReadModel>>
  > {  
    try {
      const result = await this.kahootDao.getKahootById(query.kahootId);
      
      if (result.isLeft()) {
        const repoError = result.getLeft();
        return Either.makeLeft(repoError);
      }
      return result as Either<GetKahootByIdError, Optional<KahootReadModel>>;
      
    } catch (error) {
      const unexpectedError: GetKahootByIdError = {
        type: 'UnexpectedError',
        message: 'Error inesperado obteniendo kahoot',
        timestamp: new Date(),
        originalError: error
      };
      
      return Either.makeLeft(unexpectedError);
    }
  }
}