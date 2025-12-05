// src/kahoots/application/queries/get-kahoot-by-id.handler.ts
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { IKahootDao } from '../ports/kahoot.dao.port';
import { GetKahootByIdQuery } from './get-kahoot-by-id.query';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { KahootReadModel } from '../read-model/kahoot.response.read.model';
import { Either } from 'src/core/types/either';
import { GetKahootByIdError } from '../../errors/kahoot-aplication.errors';
import { KahootNotFoundError } from 'src/kahoots/domain/errors/kahoot-domain.errors';

@QueryHandler(GetKahootByIdQuery)
export class GetKahootByIdHandler implements IQueryHandler<GetKahootByIdQuery, Either<GetKahootByIdError, KahootReadModel>> {
  constructor(
    @Inject(DaoName.Kahoot) 
    private readonly kahootDao: IKahootDao
  ) {}

  async execute(query: GetKahootByIdQuery): Promise<Either<GetKahootByIdError, KahootReadModel>> {
    try {
      const result = await this.kahootDao.getKahootById(query.kahootId);
      
      if (result.isLeft()) {
        const repoError = result.getLeft();
        return Either.makeLeft(repoError);
      }
      
      const optionalReadModel = result.getRight();
      if (!optionalReadModel.hasValue()) {
        return Either.makeLeft({
          type: 'KahootNotFound',
          message: `Kahoot con ID ${query.kahootId} no encontrado`,
          kahootId: query.kahootId,
          timestamp: new Date(),
        } as KahootNotFoundError);
      }
      
      return Either.makeRight(optionalReadModel.getValue());
      
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