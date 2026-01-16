/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\users\users.repository.postgres.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// --- Core Types & Interfaces ---
import { Either, ErrorData } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

// --- Domain & Aggregates ---
import { IUserRepository } from 'src/users/domain/ports/IUserRepository';
import { User } from 'src/users/domain/aggregates/user';
import { UserId } from 'src/core/domain/shared-value-objects/id-objects/user.id';
import { UserEmail } from 'src/users/domain/value-objects/user.email';
import { UserName } from 'src/users/domain/value-objects/user.user-name';

// --- Value Objects ---
import { UserRole } from 'src/users/domain/value-objects/user.roles';
import { UserState } from 'src/users/domain/value-objects/user.state';

// --- Infrastructure ---
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Entities & Mappers ---
import { UserEntity } from '../../entities/users.entity';
import { UserPersistencePgMapper } from './mappers/user.postgres.mapper';

// --- Error Tokens ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';

// --- Read Models ---
import { BackOfficeUserReadModel } from 'src/backoffice/application/read-model/backoffice-user.read.model';
import { Optional } from 'src/core/types/optional';

// Constantes para el contexto
const USER_PG_BASE = {
  module: 'Users',
  databaseType: 'postgresql' as const,
  collectionOrTable: 'users',
} as const;

@RepositoryPostgres(RepositoryName.User)
@Injectable()
export class UserRepositoryPostgres implements IUserRepository {
  private readonly contextBase = USER_PG_BASE;
  private readonly adapterName = UserRepositoryPostgres.name;
  private readonly portName = 'IUserRepository';

  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
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
   * Mapea un UserEntity directamente a BackOfficeUserReadModel
   */
  private mapToBackofficeReadModel(
    entity: UserEntity,
  ): BackOfficeUserReadModel {
    // Determinar si es admin
    const isAdmin =
      Array.isArray(entity.roles) && entity.roles.includes(UserRole.ADMIN);

    // Determinar el estado
    let status: string;
    if (entity.state === UserState.BLOCKED) {
      status = 'Blocked';
    } else if (entity.state === UserState.ACTIVE) {
      status = 'Active';
    } else {
      status = 'Active'; // Por defecto
    }

    return new BackOfficeUserReadModel(
      entity.id,
      entity.username,
      entity.profileName,
      entity.email,
      entity.profileDescription || '',
      entity.type,
      entity.avatarAssetId, // Asset ID
      entity.createdAt.toISOString(),
      entity.updatedAt.toISOString(),
      isAdmin,
      status,
    );
  }

  // ==========================================
  // MÉTODOS EITHER PARA BACKOFFICE
  // ==========================================

  async findUserByIdEither(
    id: UserId,
  ): Promise<Either<ErrorData, User | null>> {
    const ctx = this.getCtx('findUserByIdEither', id.value);

    try {
      const entity = await this.repository.findOne({
        where: { id: id.value },
      });

      if (!entity) {
        return Either.makeRight(null);
      }

      try {
        const user = UserPersistencePgMapper.toDomain(entity);
        return Either.makeRight(user);
      } catch (error) {
        const mappingError =
          error instanceof Error ? error : new Error('Unknown mapping error');
        const errorData = this.postgresErrorMapper.toErrorData(mappingError, {
          ...ctx,
          operation: 'mapping',
          details: 'Error mapping user entity to domain',
        });
        return Either.makeLeft(errorData);
      }
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  async saveAndGetBackofficeUserEither(
    user: User,
  ): Promise<Either<ErrorData, BackOfficeUserReadModel>> {
    const ctx = this.getCtx('saveAndGetBackofficeUserEither', user.id.value);

    try {
      // Convertir el user de dominio a entidad de persistencia
      const persistenceData = UserPersistencePgMapper.toPersistence(user);

      // Guardar y obtener la entidad actualizada
      const savedEntity = await this.repository.save(persistenceData);

      // Recargar la entidad para obtener timestamps actualizados
      const reloadedEntity = await this.repository.findOne({
        where: { id: savedEntity.id },
      });

      if (!reloadedEntity) {
        const errorData = this.postgresErrorMapper.toErrorData(
          new Error('Failed to reload saved user entity'),
          {
            ...ctx,
            operation: 'reload',
            details: 'Entity not found after save',
          },
        );
        return Either.makeLeft(errorData);
      }

      try {
        // Mapear directamente a BackOfficeUserReadModel
        const readModel = this.mapToBackofficeReadModel(reloadedEntity);
        return Either.makeRight(readModel);
      } catch (error) {
        const mappingError =
          error instanceof Error ? error : new Error('Unknown mapping error');
        const errorData = this.postgresErrorMapper.toErrorData(mappingError, {
          ...ctx,
          operation: 'mapping',
          details: 'Error mapping to backoffice read model after save',
        });
        return Either.makeLeft(errorData);
      }
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }

  // ==========================================
  // MÉTODOS LEGACY
  // ==========================================

  async save(user: User): Promise<void> {
    const entity = UserPersistencePgMapper.toPersistence(user);
    await this.repository.save(entity);
  }

  async findById(id: UserId): Promise<Optional<User>> {
    const entity = await this.repository.findOne({ where: { id: id.value } });

    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async findByEmail(email: UserEmail): Promise<Optional<User>> {
    const entity = await this.repository.findOne({
      where: { email: email.value },
    });

    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async findByUsername(username: UserName): Promise<Optional<User>> {
    const entity = await this.repository.findOne({
      where: { username: username.value },
    });

    if (!entity) return new Optional();

    return new Optional(UserPersistencePgMapper.toDomain(entity));
  }

  async existsUserByEmail(email: UserEmail): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.value },
    });
    return count > 0;
  }

  async existsUserByUsername(username: UserName): Promise<boolean> {
    const count = await this.repository.count({
      where: { username: username.value },
    });
    return count > 0;
  }

  async deleteUser(id: UserId): Promise<void> {
    await this.repository.delete(id.value);
  }

  async findAll(): Promise<User[]> {
    const entities = await this.repository.find();
    return entities.map(UserPersistencePgMapper.toDomain);
  }
}
