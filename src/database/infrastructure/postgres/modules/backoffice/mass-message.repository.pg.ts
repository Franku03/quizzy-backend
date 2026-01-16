/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\backoffice\mass-message.repository.pg.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// --- Core Types & Interfaces ---
import { Either, ErrorData } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';

// --- Domain & Aggregates ---
import { IMassMessageRepository } from 'src/backoffice/domain/ports/IMassMessageRepository';
import { MassMessage } from 'src/backoffice/domain/aggregates/mass.message';

// --- Infrastructure Decorators & Catalogs ---
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';

// --- Entities ---
import { MassNotificationEntity } from '../../entities/mass-notification.pg';

// --- Error Tokens ---
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';

// Constantes para el contexto
const MASS_MESSAGE_PG_BASE = {
  module: 'notifications',
  databaseType: 'postgresql' as const,
  collectionOrTable: 'mass_notifications',
} as const;

@RepositoryPostgres(RepositoryName.MassMessage)
@Injectable()
export class MassMessageRepositoryPostgres implements IMassMessageRepository {
  private readonly contextBase = MASS_MESSAGE_PG_BASE;
  private readonly adapterName = MassMessageRepositoryPostgres.name;
  private readonly portName = 'IMassMessageRepository';

  constructor(
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
   * Convierte un MassMessage a entidad de persistencia
   */
  private toPersistence(message: MassMessage): MassNotificationEntity {
    const snapshot = message.getSnapshot();

    const entity = new MassNotificationEntity();
    entity.massMessageId = snapshot.massMessageId;
    entity.authorId = snapshot.authorId;
    entity.title = snapshot.title;
    entity.message = snapshot.message;
    entity.sendToAdmins = snapshot.sendToAdmins;
    entity.sendToRegularUsers = snapshot.sendToRegularUsers;
    entity.createdAt = new Date(snapshot.createdAt);

    return entity;
  }

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS
  // ==========================================

  public async save(message: MassMessage): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('save', message.massMessageId.value, {
      authorId: message.authorId.value,
    });

    try {
      // Convertir a entidad de persistencia
      const persistenceData = this.toPersistence(message);

      // Usar save() que maneja upsert automáticamente
      // TypeORM's save() hace INSERT o UPDATE basado en si la entidad tiene PK
      await this.massNotificationRepository.save(persistenceData);

      return Either.makeRight(undefined);
    } catch (error) {
      const errorData = this.postgresErrorMapper.toErrorData(error, ctx);
      return Either.makeLeft(errorData);
    }
  }
}
