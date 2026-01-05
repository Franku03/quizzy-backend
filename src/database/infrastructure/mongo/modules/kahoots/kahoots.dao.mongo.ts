// src/kahoots/infrastructure/persistence/mongo/kahoot.mongo-dao.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ErrorData, Either } from 'src/core/types'; 
// Asegúrate de que este puerto esté actualizado (ver punto 2 abajo)
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';
import { KahootMongo } from '../../entities/kahoots.schema';

// [CORRECCIÓN 1] Importamos el Snapshot, no el HandlerResponse
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootReadMapper } from './mappers/kahoot.handler.mapper'; 
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

@DaoMongo(DaoName.Kahoot)
@Injectable()
export class KahootDaoMongo implements IKahootDao {

  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: KahootDaoMongo.name,
    portName: 'IKahootDao',
    module: 'kahoots',
    databaseType: 'mongodb',
    collectionOrTable: 'kahoots',
    operation: '', 
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();
  private readonly kahootReadMapper: KahootReadMapper = new KahootReadMapper();

  constructor(
    @InjectModel(KahootMongo.name)
    private readonly kahootModel: Model<KahootMongo>,
  ) { }

  async getKahootById(id: string): Promise<Either<ErrorData, KahootSnapshot | null>> {
    const fullContext: IDatabaseErrorContext = {
      ...this.adapterContextBase,
      operation: 'getKahootById',
      entityId: id
    };

    try {
      const document = await this.kahootModel
        .findOne({ id })
        .exec();
        
      if (!document) {
        return Either.makeRight<ErrorData, KahootSnapshot | null>(null);
      }

      const readModel = this.kahootReadMapper.mapDocumentToSnapshot(document);
      return Either.makeRight<ErrorData, KahootSnapshot | null>(readModel);

    } catch (error) {
      const errorData: ErrorData = this.mongoErrorMapper.toErrorData(error, fullContext);
      return Either.makeLeft<ErrorData, KahootSnapshot | null>(errorData);
    }
  }
}