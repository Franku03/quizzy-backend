import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { Either, ErrorData } from 'src/core/types';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';

import { IMassMessageRepository } from 'src/backoffice/domain/ports/IMassMessageRepository';
import { MassMessage } from 'src/backoffice/domain/aggregates/mass.message';

import {
  MassNotificationMongo,
  IMassNotificationDocument,
} from '../../entities/mass-notification.schema';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryMongo } from '../../decorators/repository-mongo.decorator';

@RepositoryMongo(RepositoryName.MassMessage)
@Injectable()
export class MassMessageRepositoryMongo implements IMassMessageRepository {
  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: MassMessageRepositoryMongo.name,
    portName: 'IMassMessageRepository',
    module: 'notifications',
    databaseType: 'mongodb',
    collectionOrTable: 'mass_notifications',
    operation: '',
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

  constructor(
    @InjectModel(MassNotificationMongo.name)
    private readonly massNotificationModel: Model<MassNotificationMongo>,
  ) {}

  /**
   * Genera el contexto usando la factory del Core.
   */
  private getCtx(operation: string, extra?: Record<string, unknown>) {
    return {
      ...this.adapterContextBase,
      operation,
      ...extra,
    };
  }

  /**
   * Convierte un MassMessage a datos de persistencia
   */
  private toPersistence(message: MassMessage): IMassNotificationDocument {
    const snapshot = message.getSnapshot();
    return {
      massMessageId: snapshot.massMessageId,
      authorId: snapshot.authorId,
      content: {
        title: snapshot.title,
        message: snapshot.message,
      },
      filter: {
        sendToAdmins: snapshot.sendToAdmins,
        sendToRegularUsers: snapshot.sendToRegularUsers,
      },
      createdAt: new Date(snapshot.createdAt),
    };
  }

  /**
   * Guarda un mensaje masivo en la base de datos
   */
  public async save(message: MassMessage): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('save', {
      massMessageId: message.massMessageId.value,
      authorId: message.authorId.value,
    });

    try {
      // Convertir a datos de persistencia
      const persistenceData = this.toPersistence(message);

      const result = await Either.tryCatch(
        this.massNotificationModel
          .findOneAndUpdate(
            { massMessageId: message.massMessageId.value },
            persistenceData,
            {
              upsert: true,
              new: true,
              runValidators: true,
            },
          )
          .lean<IMassNotificationDocument>()
          .exec(),
        (err) => this.mongoErrorMapper.toErrorData(err, ctx),
      );

      return result.map(() => undefined);
    } catch (error) {
      // Manejar errores en la construcción de la operación
      const operationError =
        error instanceof Error
          ? error
          : new Error('Unknown operation building error');

      const errorData = this.mongoErrorMapper.toErrorData(operationError, {
        ...ctx,
        operation: 'operation_building',
        details: 'Error building MongoDB operation',
      });

      return Either.makeLeft(errorData);
    }
  }
}
