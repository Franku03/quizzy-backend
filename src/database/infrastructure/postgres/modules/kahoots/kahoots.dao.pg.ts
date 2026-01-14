/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\database\infrastructure\postgres\modules\kahoots\kahoots.dao.pg.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// --- Core Logic & Types ---
import { ErrorData, Either, ErrorLayer } from 'src/core/types';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

// --- Read Models & Snapshots ---
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';
import { KahootUserDetailReadModel } from 'src/kahoots/application/dtos/kahoot-user-detail.read.model.dto';

// --- Application Ports ---
import { IKahootDao } from 'src/kahoots/application/ports/i-kahoot.dao.interface';

// --- Infrastructure: Entities & Constants ---
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';
import { KAHOOT_POSTGRES_BASE } from './constants/kahoot.pg-constants';

// --- Infrastructure: Mappers & Errors ---
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalog.enum';
import { DaoPostgres } from '../../decorators/dao-postgres.decorator';

@DaoPostgres(DaoName.Kahoot)
@Injectable()
export class KahootDao implements IKahootDao {
  private readonly contextBase = KAHOOT_POSTGRES_BASE;
  private readonly adapterName = KahootDao.name;
  private readonly portName = 'IKahootDao';

  constructor(
    @InjectRepository(KahootEntity)
    private readonly kahootRepo: Repository<KahootEntity>,

    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<
      unknown,
      IDatabaseErrorContext
    >,

    @Inject(APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_SNAPSHOT)
    private readonly kahootSnapshotMapper: IMapper<
      KahootEntity,
      KahootSnapshot
    >,
  ) {}

  // ==========================================
  // HELPERS PRIVADOS
  // ==========================================

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

  // ==========================================
  // IMPLEMENTACIÓN DE MÉTODOS (IKahootDao)
  // ==========================================

  async getKahootById(
    id: string,
  ): Promise<Either<ErrorData, KahootSnapshot | null>> {
    const ctx = this.getCtx('getKahootById', id);

    const result = await Either.tryCatch(
      this.kahootRepo.findOne({
        where: { id },
        relations: ['slides', 'slides.options'], // Importante para que el mapper tenga la data
      }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );

    return result.map((entity) =>
      entity ? this.kahootSnapshotMapper.map(entity) : null,
    );
  }

  async getKahootValidationDataByKahootId(
    id: string,
  ): Promise<Either<ErrorData, { userId: string; visibility: string } | null>> {
    const ctx = this.getCtx('getKahootValidationDataByKahootId', id);

    // En TypeORM, select() nos permite traer solo columnas específicas
    const result = await Either.tryCatch(
      this.kahootRepo.findOne({
        where: { id },
        select: ['authorId', 'visibility'],
      }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx),
    );

    return result.map((entity) => {
      if (!entity) return null;
      return {
        userId: entity.authorId,
        visibility: entity.visibility,
      };
    });
  }

  public async getKahootUserDetail(
    kahootId: string,
    userId: string,
  ): Promise<Either<ErrorData, KahootUserDetailReadModel | null>> {
    const ctx = this.getCtx('getKahootUserDetail', kahootId, { userId });

    /**
     * @implementación_pendiente
     */
    // Envolvemos en Promise.resolve para satisfacer el contrato async
    // y quitamos el error de "no await"
    return Promise.resolve(
      Either.makeLeft(
        new ErrorData(
          'INFRA_NOT_IMPLEMENTED',
          'Method getKahootUserDetail not yet implemented for PostgreSQL provider.',
          ErrorLayer.INFRASTRUCTURE,
          ctx,
        ),
      ),
    );
  }
}
