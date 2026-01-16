/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\library\library.dao.pg.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In, FindManyOptions } from 'typeorm';

// --- Core Types & Interfaces ---
import { Either, ErrorData, ErrorLayer } from 'src/core/types';
import { Optional } from 'src/core/types/optional';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

// --- Application Ports & DTOs ---
import { ILibraryDao } from 'src/library/application/queries/ports/library.dao.port';
import { GetCompletedKahootsQuery } from 'src/library/application/queries/get-completed-kahoots/get-completed-kahoots.query';
import { GetDraftsAndCreatedKahootsQuery } from 'src/library/application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { GetFavoritesQuery } from 'src/library/application/queries/get-favorite-kahoots/get-favorites.query';
import { GetInProgressKahootsQuery } from 'src/library/application/queries/get-in-progress-kahoots/get-in-progress-kahoots.query';

// --- Read Models ---
import {
  KahootReadModel,
  LibraryReadModel,
  PaginationInfo,
} from 'src/library/application/queries/read-model/library.read.model';

// --- Infrastructure ---
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';

// --- Entities ---
import { UserEntity } from '../../entities/users.entity';
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';
import { AttemptEntity } from '../../entities/attempt/attempt.entity.pg';

// --- Domain Value Objects ---
import { AttemptStatusEnum } from 'src/solo-attempts/domain/value-objects/attempt.status.enum';

// --- Error Tokens ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';

// Constantes para el contexto
const LIBRARY_PG_BASE = {
  module: 'library',
  databaseType: 'postgresql' as const,
  collectionOrTable: 'users,kahoots,attempts',
} as const;

@DaoPostgres(DaoName.Library)
@Injectable()
export class LibraryDaoPostgres implements ILibraryDao {
  private readonly contextBase = LIBRARY_PG_BASE;
  private readonly adapterName = LibraryDaoPostgres.name;
  private readonly portName = 'ILibraryDao';

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(KahootEntity)
    private readonly kahootRepository: Repository<KahootEntity>,
    @InjectRepository(AttemptEntity)
    private readonly attemptRepository: Repository<AttemptEntity>,
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly postgresErrorMapper: IErrorMapper<
      unknown,
      IDatabaseErrorContext
    >,
  ) {}

  // ==========================================
  // MÉTODO PRIVADO PARA FILTRAR KAHOOTS PRIVADOS
  // ==========================================

  /**
   * Filtra los kahoots privados que no pertenecen al usuario
   * @param libraryResult Resultado de la consulta
   * @param userId ID del usuario que hace la consulta
   * @returns LibraryReadModel filtrado
   */
  private filterPrivateKahootsFromOthers(
    libraryResult: LibraryReadModel,
    userId: string,
  ): LibraryReadModel {
    // Filtrar los datos
    const filteredData = libraryResult.data.filter((kahoot) => {
      // Si el kahoot es público, siempre se mantiene
      if (kahoot.visibility.toLowerCase() === 'public') {
        return true;
      }

      // Si el kahoot es privado, solo se mantiene si pertenece al usuario
      if (kahoot.visibility.toLowerCase() === 'private') {
        return kahoot.author.id === userId;
      }

      // Para cualquier otro tipo de visibilidad, se mantiene
      return true;
    });

    // Crear nueva paginación con el conteo actualizado
    const filteredPagination = new PaginationInfo(
      libraryResult.pagination.page,
      libraryResult.pagination.limit,
      filteredData.length, // Total actualizado
      Math.ceil(filteredData.length / libraryResult.pagination.limit),
    );

    // Retornar nuevo LibraryReadModel con los datos filtrados
    return new LibraryReadModel(filteredData, filteredPagination);
  }

  private buildQueryStructure(query: GetDraftsAndCreatedKahootsQuery) {
    // Configurar paginación
    const skip = (query.page - 1) * query.limit;
    const limit = query.limit;

    // Ordenamiento
    const order: any = {};
    order[query.orderBy] = query.order === 'asc' ? 'ASC' : 'DESC';

    // Filtros base
    const where: any = { authorId: query.userId };

    // Status
    if (query.status !== 'all') {
      where.status = query.status;
    }

    // Visibilidad
    if (query.visibility !== 'all') {
      where.visibility = query.visibility;
    }

    // Categorías
    if (query.categories && query.categories.length > 0) {
      where.category = In(query.categories);
    }

    // Búsqueda por texto
    if (query.q) {
      where.$or = [
        { title: ILike(`%${query.q}%`) },
        { description: ILike(`%${query.q}%`) },
        { authorId: ILike(`%${query.q}%`) },
      ];
    }

    return { where, order, skip, limit };
  }

  private async mapKahootsToLibraryReadModel(
    kahoots: KahootEntity[],
  ): Promise<KahootReadModel[]> {
    if (kahoots.length === 0) {
      return [];
    }

    // 1. Obtener todos los authorIds únicos
    const authorIds = [...new Set(kahoots.map((k) => k.authorId))];

    // 2. Consultar los usuarios correspondientes
    const authors = await this.userRepository.find({
      where: { id: In(authorIds) },
      select: ['id', 'profileName'],
    });

    // 3. Crear un mapa userId -> nombre
    const authorMap = new Map(authors.map((a) => [a.id, a.profileName]));

    // 4. Mapear kahoots con el nombre correcto
    return kahoots.map(
      (k) =>
        new KahootReadModel(
          k.id,
          k.title ?? null,
          k.description ?? null,
          k.coverImageId ?? null,
          k.visibility as 'public' | 'private',
          k.themeId,
          {
            id: k.authorId,
            name: authorMap.get(k.authorId) ?? 'Unknown Author',
          },
          k.createdAt.toISOString(),
          k.playCount,
          k.category ?? '',
          k.status as 'draft' | 'published',
        ),
    );
  }

  private async userExists(userId: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { id: userId, isDeleted: false },
    });
    return count > 0;
  }

  private handleError(
    layer: ErrorLayer,
    context: IDatabaseErrorContext,
    code: string,
    errorMessage: string,
  ): ErrorData {
    return new ErrorData(code, errorMessage, layer, {
      ...context,
    });
  }

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS
  // ==========================================

  async getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const ctx = this.getCtx('getDraftsAndCreatedKahootsFrom', query.userId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      visibility: query.visibility,
    });

    try {
      // Verificar si el usuario existe
      const userExists = await this.userExists(query.userId);
      if (!userExists) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`User with id ${query.userId} not found`),
          { ...ctx, operation: 'user_validation' },
        );
        return Either.makeLeft(errorData);
      }

      // Construir consulta
      const { where, order, skip, limit } = this.buildQueryStructure(query);

      const options: FindManyOptions<KahootEntity> = {
        where,
        order,
        skip,
        take: limit,
      };

      // Ejecutar consultas en paralelo
      const [kahoots, totalCount] = await Promise.all([
        this.kahootRepository.find(options),
        this.kahootRepository.count({ where }),
      ]);

      // Mapear resultados
      const data = await this.mapKahootsToLibraryReadModel(kahoots);
      const totalPages = Math.ceil(totalCount / limit);

      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );

      const library = new LibraryReadModel(data, pagination);
      return Either.makeRight(library);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const ctx = this.getCtx('GetFavorites', query.userId, {
      page: query.page,
      limit: query.limit,
      status: query.status,
      visibility: query.visibility,
    });

    try {
      // Verificar si el usuario existe
      const userExists = await this.userExists(query.userId);
      if (!userExists) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`User with id ${query.userId} not found`),
          { ...ctx, operation: 'user_validation' },
        );
        return Either.makeLeft(errorData);
      }

      // Buscar usuario
      const user = await this.userRepository.findOne({
        where: { id: query.userId, isDeleted: false },
        select: ['id', 'favorites'],
      });

      if (!user) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`User with id ${query.userId} not found`),
          { ...ctx, operation: 'user_fetch' },
        );
        return Either.makeLeft(errorData);
      }

      // Obtener IDs de favoritos
      const favoriteIds = user.favorites ?? [];
      if (favoriteIds.length === 0) {
        const emptyPagination = new PaginationInfo(
          query.page,
          query.limit,
          0,
          0,
        );
        const emptyLibrary = new LibraryReadModel([], emptyPagination);
        return Either.makeRight(emptyLibrary);
      }

      // Configurar paginación
      const skip = (query.page - 1) * query.limit;
      const limit = query.limit;

      // Consultar kahoots favoritos
      const [kahoots, totalCount] = await Promise.all([
        this.kahootRepository.find({
          where: { id: In(favoriteIds) },
          skip,
          take: limit,
        }),
        this.kahootRepository.count({
          where: { id: In(favoriteIds) },
        }),
      ]);

      // Mapear resultados
      const data = await this.mapKahootsToLibraryReadModel(kahoots);
      const totalPages = Math.ceil(totalCount / limit);

      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );

      const library = new LibraryReadModel(data, pagination);

      // Aplicar filtro de kahoots privados
      const filteredLibrary = this.filterPrivateKahootsFromOthers(
        library,
        query.userId,
      );

      return Either.makeRight(filteredLibrary);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async checkIfCanBeAddedToFavorites(
    kahootId: string,
  ): Promise<Optional<ErrorData>> {
    const ctx = this.getCtx('checkIfCanBeAddedToFavorites', kahootId);

    try {
      const kahoot = await this.kahootRepository.findOne({
        where: { id: kahootId },
      });

      if (!kahoot) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`Kahoot with id ${kahootId} not Found`),
          { ...ctx, operation: 'kahoot_validation' },
        );
        return new Optional(errorData);
      }

      return new Optional();
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return new Optional(errorData);
    }
  }

  async getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const ctx = this.getCtx('getCompletedKahoots', query.userId, {
      page: query.page,
      limit: query.limit,
    });

    try {
      // Verificar si el usuario existe
      const userExists = await this.userExists(query.userId);
      if (!userExists) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`User with id ${query.userId} not found`),
          { ...ctx, operation: 'user_validation' },
        );
        return Either.makeLeft(errorData);
      }

      // Configurar paginación
      const skip = (query.page - 1) * query.limit;
      const limit = query.limit;

      // Consultar intentos completados
      const [attempts, totalCount] = await Promise.all([
        this.attemptRepository.find({
          where: {
            playerId: query.userId,
            status: AttemptStatusEnum.COMPLETED,
          },
          order: { completedAt: 'DESC' },
          skip,
          take: limit,
        }),
        this.attemptRepository.count({
          where: {
            playerId: query.userId,
            status: AttemptStatusEnum.COMPLETED,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      // Obtener IDs de kahoots
      const kahootIds = attempts.map((a) => a.kahootId);
      let kahoots: KahootEntity[] = [];

      if (kahootIds.length > 0) {
        kahoots = await this.kahootRepository.find({
          where: { id: In(kahootIds) },
        });
      }

      // Mapear resultados
      const data = await this.mapKahootsToLibraryReadModel(kahoots);

      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );

      const library = new LibraryReadModel(data, pagination);

      // Aplicar filtro de kahoots privados
      const filteredLibrary = this.filterPrivateKahootsFromOthers(
        library,
        query.userId,
      );

      return Either.makeRight(filteredLibrary);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>> {
    const ctx = this.getCtx('getInProgressKahoots', query.userId, {
      page: query.page,
      limit: query.limit,
    });

    try {
      // Verificar si el usuario existe
      const userExists = await this.userExists(query.userId);
      if (!userExists) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error(`User with id ${query.userId} not found`),
          { ...ctx, operation: 'user_validation' },
        );
        return Either.makeLeft(errorData);
      }

      // Configurar paginación
      const skip = (query.page - 1) * query.limit;
      const limit = query.limit;

      // Consultar intentos en progreso
      const [attempts, totalCount] = await Promise.all([
        this.attemptRepository.find({
          where: {
            playerId: query.userId,
            status: AttemptStatusEnum.IN_PROGRESS,
          },
          order: { lastPlayedAt: 'DESC' },
          skip,
          take: limit,
        }),
        this.attemptRepository.count({
          where: {
            playerId: query.userId,
            status: AttemptStatusEnum.IN_PROGRESS,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      // Obtener IDs de kahoots
      const kahootIds = attempts.map((a) => a.kahootId);
      let kahoots: KahootEntity[] = [];

      if (kahootIds.length > 0) {
        kahoots = await this.kahootRepository.find({
          where: { id: In(kahootIds) },
        });
      }

      // Mapear resultados
      const data = await this.mapKahootsToLibraryReadModel(kahoots);

      const pagination = new PaginationInfo(
        query.page,
        limit,
        totalCount,
        totalPages,
      );

      const library = new LibraryReadModel(data, pagination);

      // Aplicar filtro de kahoots privados
      const filteredLibrary = this.filterPrivateKahootsFromOthers(
        library,
        query.userId,
      );

      return Either.makeRight(filteredLibrary);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

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
}
