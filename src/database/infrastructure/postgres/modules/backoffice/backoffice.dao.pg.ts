/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\backoffice\backoffice.dao.pg.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindManyOptions, In } from 'typeorm';

// --- Core Types & Interfaces ---
import { Either, ErrorData } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

// --- Infrastructure Decorators & Catalogs ---
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// --- Application Ports & DTOs ---
import { IBackofficeDao } from 'src/backoffice/application/queries/ports/backoffice.dao.port';
import { GetBackofficeUsersQuery } from 'src/backoffice/application/queries/get-backoffice-users/get-backoffice-users.query';
import { GetMassNotificationsQuery } from 'src/backoffice/application/queries/get-mass-notifications/get-mass-notificactions.query';

// --- Read Models ---
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

// --- Domain Value Objects ---
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { UserState } from 'src/users/domain/value-objects/user.state';
import { OrderByEnum } from 'src/backoffice/infrastructure/nestjs/dtos/backoffice-user-pagination.dto';

// --- Entities ---
import { UserEntity } from '../../entities/users.entity';
import { MassNotificationEntity } from '../../entities/mass-notification.pg';

// --- Error Tokens ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';

// Constantes para el contexto
const BACKOFFICE_PG_BASE = {
  module: 'Backoffice',
  databaseType: 'postgresql' as const,
  collectionOrTable: 'users,mass_notifications',
} as const;

@DaoPostgres(DaoName.Backoffice)
@Injectable()
export class BackofficeDaoPostgres implements IBackofficeDao {
  private readonly contextBase = BACKOFFICE_PG_BASE;
  private readonly adapterName = BackofficeDaoPostgres.name;
  private readonly portName = 'IBackofficeDao';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MassNotificationEntity)
    private readonly massNotificationRepository: Repository<MassNotificationEntity>,
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly postgresErrorMapper: IErrorMapper<
      unknown,
      IDatabaseErrorContext
    >,
  ) {}

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

  /**
   * Genera el contexto de error
   */
  private getCtx(
    operation: string,
    entityId?: string,
    extra?: Record<string, unknown>,
  ) {
    return createDatabaseContext(
      this.contextBase,
      this.adapterName,
      this.portName,
      operation,
      entityId,
      extra,
    );
  }

  /**
   * Mapea OrderByEnum a campos de TypeORM
   */
  private mapOrderByToField(orderBy: string): string {
    const mapping: Record<string, string> = {
      [OrderByEnum.CREATED_AT]: 'createdAt',
      [OrderByEnum.NAME]: 'profileName',
      [OrderByEnum.USERTYPE]: 'type',
      [OrderByEnum.UPDATED_AT]: 'updatedAt',
    };
    return mapping[orderBy] || 'createdAt';
  }

  /**
   * Mapea un UserEntity a BackOfficeUserReadModel
   */
  private mapUserToReadModel(user: UserEntity): BackOfficeUserReadModel {
    // Determinar si es admin
    const isAdmin =
      Array.isArray(user.roles) && user.roles.includes(UserRole.ADMIN);

    // Determinar el estado
    let status: string;
    if (user.state === UserState.BLOCKED) {
      status = 'Blocked';
    } else if (user.state === UserState.ACTIVE) {
      status = 'Active';
    } else {
      status = 'Active'; // Por defecto
    }

    return new BackOfficeUserReadModel(
      user.id,
      user.username,
      user.profileName,
      user.email,
      user.profileDescription || '',
      user.type,
      user.avatarAssetId, // Este es el asset ID, no la URL
      user.createdAt.toISOString(),
      user.updatedAt.toISOString(),
      isAdmin,
      status,
    );
  }

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS
  // ==========================================

  async getBackofficeUsers(
    query: GetBackofficeUsersQuery,
  ): Promise<Either<ErrorData, BackOfficeUserPaginationReadModel>> {
    const ctx = this.getCtx('getBackofficeUsers', undefined, {
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
      // Construir where clause
      const where: any = { isDeleted: false };

      if (query.name) {
        where.profileName = ILike(`%${query.name}%`);
      }

      if (query.userId) {
        where.id = query.userId;
      }

      // Configurar paginación
      const limit = query.limit || 20;
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      // Configurar ordenamiento
      const orderField = this.mapOrderByToField(
        query.orderBy || OrderByEnum.CREATED_AT,
      );
      const orderDirection = query.order === 'asc' ? 'ASC' : 'DESC';
      const order: any = { [orderField]: orderDirection };

      // Crear opciones de búsqueda
      const options: FindManyOptions<UserEntity> = {
        where,
        order,
        skip,
        take: limit,
      };

      // Ejecutar consultas en paralelo
      const [users, totalCount] = await Promise.all([
        this.userRepository.find(options),
        this.userRepository.count({ where }),
      ]);

      // Mapear usuarios a read models
      const userReadModels = users.map((user) => this.mapUserToReadModel(user));

      // Calcular información de paginación
      const totalPages = Math.ceil(totalCount / limit);
      const paginationInfo = new PaginationInfo(
        page,
        limit,
        totalCount,
        totalPages,
      );

      const result = new BackOfficeUserPaginationReadModel(
        userReadModels,
        paginationInfo,
      );

      return Either.makeRight(result);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async getMassNotifications(
    query: GetMassNotificationsQuery,
  ): Promise<Either<ErrorData, BackofficeNotificationPaginationReadModel>> {
    const ctx = this.getCtx('getMassNotifications', undefined, {
      filters: {
        userId: query.userId,
        limit: query.limit,
        page: query.page,
        orderBy: query.orderBy,
        order: query.order,
      },
    });

    try {
      // Construir where clause
      const where: any = {};

      if (query.userId) {
        where.authorId = query.userId;
      }

      // Configurar paginación
      const limit = Math.min(query.limit || 20, 50);
      const page = query.page || 1;
      const skip = (page - 1) * limit;

      // Configurar ordenamiento
      const orderDirection = query.order === 'desc' ? 'DESC' : 'ASC';
      const order: any = { createdAt: orderDirection };

      // Crear opciones de búsqueda (sin relaciones para mejor performance)
      const options: FindManyOptions<MassNotificationEntity> = {
        where,
        order,
        skip,
        take: limit,
      };

      // Ejecutar consultas en paralelo
      const [notifications, totalCount] = await Promise.all([
        this.massNotificationRepository.find(options),
        this.massNotificationRepository.count({ where }),
      ]);

      // Obtener todos los autores en una sola consulta
      const authorIds = [...new Set(notifications.map((n) => n.authorId))];
      let authors: UserEntity[] = [];

      if (authorIds.length > 0) {
        authors = await this.userRepository.find({
          where: {
            id: In(authorIds), // Usar el operador In aquí
            isDeleted: false,
          },
        });
      }

      const authorMap = new Map(authors.map((author) => [author.id, author]));

      // Mapear notificaciones a read models
      const notificationReadModels = notifications.map((notification) => {
        // Construir sender desde el mapa de autores
        let sender: NotificationSender = {
          id: notification.authorId,
          name: 'Unknown Author',
          email: 'unknown@example.com',
          imageUrl: null,
        };

        const author = authorMap.get(notification.authorId);
        if (author) {
          sender = {
            id: author.id,
            name: author.profileName,
            email: author.email,
            imageUrl: author.avatarAssetId, // Asset ID
          };
        }

        return new BackofficeNotificationReadModel(
          notification.massMessageId,
          notification.title,
          notification.message,
          notification.createdAt.toISOString(),
          sender,
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

      const result = new BackofficeNotificationPaginationReadModel(
        notificationReadModels,
        paginationInfo,
      );

      return Either.makeRight(result);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async verifyIfUserIsAdmin(
    userId: string,
  ): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('verifyIfUserIsAdmin', userId);

    try {
      const user = await this.userRepository.findOne({
        where: {
          id: userId,
          isDeleted: false,
        },
        select: ['roles'],
      });

      if (!user) {
        return Either.makeRight(false);
      }

      // Verificar si el usuario tiene el rol ADMIN
      const isAdmin =
        Array.isArray(user.roles) && user.roles.includes(UserRole.ADMIN);
      return Either.makeRight(isAdmin);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async getUsersForNotification(
    filter: UserNotificationFilter,
  ): Promise<Either<ErrorData, UserForNotification[]>> {
    const ctx = this.getCtx('getUsersForNotification', undefined, {
      sendToAdmins: filter.sendToAdmins,
      sendToRegularUsers: filter.sendToRegularUsers,
    });

    try {
      // Construir query
      const queryBuilder = this.userRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.profileName', 'user.username'])
        .where('user.isDeleted = :isDeleted', { isDeleted: false })
        .andWhere('user.state = :state', { state: UserState.ACTIVE });

      // Aplicar filtros de roles usando JSONB
      if (
        filter.sendToAdmins !== undefined &&
        filter.sendToRegularUsers !== undefined
      ) {
        if (filter.sendToAdmins && !filter.sendToRegularUsers) {
          // Solo admins: roles contiene 'admin'
          queryBuilder.andWhere('user.roles::jsonb @> \'"admin"\'');
        } else if (!filter.sendToAdmins && filter.sendToRegularUsers) {
          // Solo usuarios regulares: roles no contiene 'admin'
          queryBuilder.andWhere('NOT (user.roles::jsonb @> \'"admin"\')');
        }
        // Si ambos son true o ambos son false, no aplicamos filtro de roles
      }

      // Ejecutar consulta
      const users = await queryBuilder.getMany();

      // Mapear a UserForNotification
      const usersForNotification: UserForNotification[] = users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.profileName || user.username || 'User',
      }));

      return Either.makeRight(usersForNotification);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }
}
