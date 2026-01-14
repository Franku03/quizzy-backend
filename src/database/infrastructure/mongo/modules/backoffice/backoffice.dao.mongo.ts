// Manejo de Errores
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import { Either, ErrorData } from 'src/core/types';
import { MongoErrorMapper } from '../../errors/mongo-error.mapper';

import { DaoMongo } from '../../decorators/dao-mongo.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { Injectable } from '@nestjs/common';
import { IBackofficeDao } from 'src/backoffice/application/queries/ports/backoffice.dao.port';
import { InjectModel } from '@nestjs/mongoose';
import { UserMongo } from '../../entities/users.schema';
import { Model, FilterQuery } from 'mongoose';
import { GetBackofficeUsersQuery } from 'src/backoffice/application/queries/get-backoffice-users/get-backoffice-users.query';
import { GetMassNotificationsQuery } from 'src/backoffice/application/queries/get-mass-notifications/get-mass-notificactions.query';
import { BackofficeNotificationPaginationReadModel } from 'src/backoffice/application/read-model/backoffice-notifications.read.model';
import {
  BackOfficeUserPaginationReadModel,
  BackOfficeUserReadModel,
  PaginationInfo,
} from 'src/backoffice/application/read-model/backoffice-user.read.model';
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { OrderByEnum } from 'src/backoffice/infrastructure/nestjs/dtos/backoffice-user-pagination.dto';

// Interface para el documento plano de usuario
interface UserLeanDocument {
  userId: string;
  email: string;
  username: string;
  type: string;
  profile: {
    name: string;
    description: string;
    avatarUrl?: string;
  };
  state: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

@DaoMongo(DaoName.Backoffice)
@Injectable()
export class BackofficeDaoMongo implements IBackofficeDao {
  private readonly adapterContextBase: IDatabaseErrorContext = {
    adapterName: BackofficeDaoMongo.name,
    portName: 'IBackofficeDao',
    module: 'Backoffice',
    databaseType: 'mongodb',
    collectionOrTable: 'users',
    operation: '',
  } as const;

  private readonly mongoErrorMapper: MongoErrorMapper = new MongoErrorMapper();

  constructor(
    @InjectModel(UserMongo.name) private readonly userModel: Model<UserMongo>,
    //Injectar notifications.schema.ts
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

  async getBackofficeUsers(
    query: GetBackofficeUsersQuery,
  ): Promise<Either<ErrorData, BackOfficeUserPaginationReadModel>> {
    const ctx = this.getCtx('getBackofficeUsers', {
      filters: {
        name: query.name,
        userId: query.userId,
        limit: query.limit,
        page: query.page,
        orderBy: query.orderBy,
        order: query.order,
      },
    });

    try {
      // Construir query de filtrado con tipos específicos
      const filter: FilterQuery<UserMongo> = { isDeleted: false }; // Solo usuarios no eliminados

      if (query.name) {
        // Buscar por nombre en profile.name (case-insensitive)
        filter['profile.name'] = { $regex: query.name, $options: 'i' };
      }

      if (query.userId) {
        filter.userId = query.userId;
      }

      // Calcular skip para paginación
      const limit = query.limit || 20;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      // Construir sort con tipos específicos
      const sort: Record<string, 1 | -1> = {};

      // Mapear orderBy a campos reales de MongoDB
      const fieldMapping: Record<OrderByEnum, string> = {
        [OrderByEnum.CREATED_AT]: 'createdAt',
        [OrderByEnum.NAME]: 'profile.name',
        [OrderByEnum.USERTYPE]: 'type',
        [OrderByEnum.UPDATED_AT]: 'updatedAt',
      };

      const orderBy = query.orderBy || OrderByEnum.CREATED_AT;
      const order = query.order || 'desc';
      const mongoField = fieldMapping[orderBy] || 'createdAt';
      sort[mongoField] = order === 'desc' ? -1 : 1;

      const result = await Either.tryCatch(
        Promise.all([
          // Contar total de documentos
          this.userModel.countDocuments(filter).exec(),
          // Obtener documentos paginados
          this.userModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean<UserLeanDocument[]>()
            .exec(),
        ]),
        (err) => this.mongoErrorMapper.toErrorData(err, ctx),
      );

      return result.chain(([totalCount, documents]) => {
        try {
          // Mapear documentos a BackOfficeUserReadModel
          const userReadModels = documents.map((doc: UserLeanDocument) => {
            // Determinar si es admin (busca el rol ADMIN en el array)
            const isAdmin =
              Array.isArray(doc.roles) && doc.roles.includes(UserRole.ADMIN);

            // Determinar el estado
            let status: string;
            if (doc.state === UserState.BLOCKED) {
              status = 'Blocked';
            } else if (doc.state === UserState.ACTIVE) {
              status = 'Active';
            } else {
              status = 'Active'; // Por defecto
            }

            return new BackOfficeUserReadModel(
              doc.userId,
              doc.username,
              doc.profile.name || '',
              doc.email,
              doc.profile.description || '',
              doc.type,
              doc.profile.avatarUrl || null,
              doc.createdAt
                ? doc.createdAt.toISOString()
                : new Date().toISOString(),
              doc.updatedAt
                ? doc.updatedAt.toISOString()
                : new Date().toISOString(),
              isAdmin,
              status,
            );
          });

          // Calcular información de paginación
          const totalPages = Math.ceil(totalCount / limit);
          const paginationInfo = new PaginationInfo(
            page,
            limit,
            totalCount,
            totalPages,
          );

          // Crear modelo de paginación
          const paginationReadModel = new BackOfficeUserPaginationReadModel(
            userReadModels,
            paginationInfo,
          );

          return Either.makeRight(paginationReadModel);
        } catch (error) {
          // Crear un ErrorData para errores de mapeo
          const mappingError =
            error instanceof Error ? error : new Error('Unknown mapping error');
          const errorData = this.mongoErrorMapper.toErrorData(mappingError, {
            ...ctx,
            operation: 'mapping',
            details: 'Error mapping user documents to read models',
          });
          return Either.makeLeft(errorData);
        }
      });
    } catch (error) {
      // Manejar errores en la construcción de la query
      const queryError =
        error instanceof Error
          ? error
          : new Error('Unknown query building error');
      const errorData = this.mongoErrorMapper.toErrorData(queryError, {
        ...ctx,
        operation: 'query_building',
        details: 'Error building MongoDB query',
      });
      return Either.makeLeft(errorData);
    }
  }

  getMassNotifications(
    query: GetMassNotificationsQuery,
  ): Promise<Either<ErrorData, BackofficeNotificationPaginationReadModel>> {
    throw new Error('Method not implemented.');
  }
}
