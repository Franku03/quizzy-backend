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
import {
  BackofficeNotificationPaginationReadModel,
  BackofficeNotificationReadModel,
  NotificationSender,
  UserForNotification,
  UserNotificationFilter,
} from 'src/backoffice/application/read-model/backoffice-notifications.read.model';
import {
  BackOfficeUserPaginationReadModel,
  BackOfficeUserReadModel,
  PaginationInfo,
} from 'src/backoffice/application/read-model/backoffice-user.read.model';
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { OrderByEnum } from 'src/backoffice/infrastructure/nestjs/dtos/backoffice-user-pagination.dto';
import { MassNotificationMongo } from '../../entities/mass-notification.schema';

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
    @InjectModel(MassNotificationMongo.name)
    private readonly massNotificationModel: Model<MassNotificationMongo>,
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

  async getMassNotifications(
    query: GetMassNotificationsQuery,
  ): Promise<Either<ErrorData, BackofficeNotificationPaginationReadModel>> {
    const ctx = this.getCtx('getMassNotifications', {
      filters: {
        userId: query.userId,
        limit: query.limit,
        page: query.page,
        orderBy: query.orderBy,
        order: query.order,
      },
    });

    try {
      // Construir query de filtrado
      const filter: FilterQuery<MassNotificationMongo> = {};

      if (query.userId) {
        // Filtrar por el autor de la notificación
        filter.authorId = query.userId;
      }

      // Calcular paginación
      const limit = Math.min(query.limit || 20, 50); // Máximo 50 como en el Query
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      // Construir sort
      const sort: Record<string, 1 | -1> = {};

      // Mapear orderBy a campos reales de MongoDB
      const fieldMapping: Record<OrderByEnum, string> = {
        [OrderByEnum.CREATED_AT]: 'createdAt',
        [OrderByEnum.NAME]: 'createdAt', // Temporalmente usar createdAt hasta implementar join
        [OrderByEnum.USERTYPE]: 'createdAt', // Temporalmente usar createdAt hasta implementar join
        [OrderByEnum.UPDATED_AT]: 'createdAt', // created_at ya que no hay updated_at
      };

      const orderBy = query.orderBy || OrderByEnum.CREATED_AT;
      const order = query.order || 'asc';
      const mongoField = fieldMapping[orderBy] || 'createdAt';
      sort[mongoField] = order === 'desc' ? -1 : 1;

      // Ejecutar las consultas en paralelo
      const [totalCount, documents] = await Promise.all([
        // Contar total de documentos
        this.massNotificationModel.countDocuments(filter).exec(),
        // Obtener documentos paginados
        this.massNotificationModel
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean<any[]>()
          .exec(),
      ]);

      // Mapear documentos a BackofficeNotificationReadModel
      const notificationReadModels = await Promise.all(
        documents.map(async (doc) => {
          // Buscar información del autor
          let sender: NotificationSender = {
            id: doc.authorId,
            name: 'Unknown Author',
            email: 'unknown@example.com',
            imageUrl: null,
          };

          if (doc.authorId) {
            const author = await this.userModel
              .findOne({ userId: doc.authorId, isDeleted: false })
              .lean<UserLeanDocument>()
              .exec();

            if (author) {
              // Usar avatarUrl de la interface UserLeanDocument
              sender = {
                id: doc.authorId,
                name: author.profile?.name || 'Unknown',
                email: author.email || 'unknown@example.com',
                imageUrl: author.profile?.avatarUrl || null,
              };
            }
          }

          return new BackofficeNotificationReadModel(
            doc.massMessageId,
            doc.content.title,
            doc.content.message,
            doc.createdAt
              ? doc.createdAt.toISOString()
              : new Date().toISOString(),
            sender,
          );
        }),
      );

      // Calcular información de paginación
      const totalPages = Math.ceil(totalCount / limit);
      const paginationInfo = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );

      // Crear modelo de paginación
      const paginationReadModel = new BackofficeNotificationPaginationReadModel(
        notificationReadModels,
        paginationInfo,
      );

      return Either.makeRight(paginationReadModel);
    } catch (error) {
      // Manejar errores
      const errorData = this.mongoErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async verifyIfUserIsAdmin(
    userId: string,
  ): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('verifyIfUserIsAdmin', {
      userId,
    });

    try {
      // Buscar el usuario por userId
      const user = await this.userModel
        .findOne({
          userId: userId,
          isDeleted: false,
        })
        .lean()
        .exec();

      // Si el usuario no existe o está eliminado, devolver false
      if (!user) {
        return Either.makeRight(false);
      }

      // Verificar si el usuario tiene el rol ADMIN
      const isAdmin =
        Array.isArray(user.roles) && user.roles.includes(UserRole.ADMIN);

      return Either.makeRight(isAdmin);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async getUsersForNotification(
    filter: UserNotificationFilter,
  ): Promise<Either<ErrorData, UserForNotification[]>> {
    const ctx = this.getCtx('getUsersForNotification', {
      sendToAdmins: filter.sendToAdmins,
      sendToRegularUsers: filter.sendToRegularUsers,
    });

    try {
      // Construir el filtro de MongoDB
      const mongoFilter: FilterQuery<UserMongo> = {
        isDeleted: false,
        state: UserState.ACTIVE,
      };

      // Aplicar filtros de roles
      if (
        filter.sendToAdmins !== undefined &&
        filter.sendToRegularUsers !== undefined
      ) {
        if (filter.sendToAdmins && !filter.sendToRegularUsers) {
          mongoFilter.roles = UserRole.ADMIN;
        } else if (!filter.sendToAdmins && filter.sendToRegularUsers) {
          mongoFilter.roles = { $ne: UserRole.ADMIN };
        }
      }

      // Ejecutar la consulta - seleccionamos solo los campos necesarios
      const users = await this.userModel
        .find(mongoFilter)
        .select('userId email profile.name')
        .lean<UserLeanDocument[]>()
        .exec();

      // Mapear a UserForNotification simplificado
      const usersForNotification: UserForNotification[] = users.map(
        (user: UserLeanDocument) => ({
          id: user.userId,
          email: user.email,
          name: user.profile.name || user.username || 'User',
        }),
      );

      return Either.makeRight(usersForNotification);
    } catch (error) {
      const errorData = this.mongoErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }
}
