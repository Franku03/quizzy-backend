// src/kahoots/infrastructure/persistence/mongo/kahoot.mongo-dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IKahootDao } from 'src/kahoots/application/queries/ports/kahoot.dao.port';
import { KahootMongo } from '../../entities/kahoots.schema';
import { MongoErrorFactory } from 'src/database/infrastructure/errors/mongo/mongo-error.factory';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { KahootReadMapper } from './mappers/kahoot.hanlder.mapper';
import { OptionalRepositoryResult, RepositoryResultHelpers } from 'src/core/types/repository-result.type';

@Injectable()
export class KahootDaoMongo implements IKahootDao {
  private readonly context = {
    repositoryName: 'KahootRepository',
    table: 'kahoots',
    module: 'kahoots',
  };
  private readonly kahootReadMapper: KahootReadMapper = new KahootReadMapper();
  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) {}

  
  async getKahootById(id: string): Promise<OptionalRepositoryResult<KahootHandlerResponse>> {
    const operation = 'getKahootById';
    const fullContext = { ...this.context, operation, documentId: id };

    try {
      // 1. Obtener documento de MongoDB
      const document = await this.kahootModel
        .findOne({ id })
        .lean()
        .exec();
      
      if (!document) {
        return RepositoryResultHelpers.optionalEmpty();
      }

      // 2. Mapear explícitamente a HandlerResponse
      const readModel = this.kahootReadMapper.mapDocumentToResponse(document);
      return RepositoryResultHelpers.optionalSuccess(readModel);
      
    } catch (error) {
      // 3. Mapear error de MongoDB a error estandarizado
      const mongoError = MongoErrorFactory.fromMongoError(error, fullContext);
      return RepositoryResultHelpers.optionalFailure(mongoError);
    }
  }
}