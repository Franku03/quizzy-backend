// src/kahoots/infrastructure/persistence/mongo/kahoot.mongo-dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorData, Either } from 'src/core/types'; 
import { IKahootDao } from 'src/kahoots/application/ports/kahoot.dao.port';
import { KahootMongo } from '../../entities/kahoots.schema';
import { KahootHandlerResponse } from 'src/kahoots/application/response/kahoot.handler.response';
import { KahootReadMapper } from './mappers/kahoot.hanlder.mapper';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

@Injectable()
export class KahootDaoMongo implements IKahootDao {

  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: KahootDaoMongo.name,
    portName: 'IKahootDao',
    module: 'kahoots',
    databaseType: 'mongodb',
    collectionOrTable: 'kahoots',
    operation: '', // Base que se sobreescribe
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();
  private readonly kahootReadMapper: KahootReadMapper = new KahootReadMapper();

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) { }

  async getKahootById(id: string): Promise<Either<ErrorData, KahootHandlerResponse | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'getKahootById',
      entityId: id
    };

    try {
      const document = await this.kahootModel
        .findOne({ id })
        .lean()
        .exec();
        
      if (!document) {
        return Either.makeRight<ErrorData, KahootHandlerResponse | null>(null);
      }

      const readModel = this.kahootReadMapper.mapDocumentToResponse(document);
      return Either.makeRight<ErrorData, KahootHandlerResponse | null>(readModel);

    } catch (error) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, KahootHandlerResponse | null>(errorData);
    }
  }
}