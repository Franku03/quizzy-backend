// src/kahoots/infrastructure/persistence/postgres/kahoot.repository.pg.ts

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// --- Core Logic ---
import { Optional, Either, ErrorData } from 'src/core/types';
import { Kahoot } from 'src/kahoots/domain/aggregates/kahoot';
import { KahootId } from 'src/core/domain/shared-value-objects/id-objects/kahoot.id';
import { KahootFactory } from 'src/kahoots/domain/factories/kahoot.factory';
import { KahootSnapshot } from 'src/core/domain/snapshots/snapshot.kahoot';

// --- Interfaces & Tokens ---
import { IKahootRepository } from 'src/kahoots/domain/ports/IKahootRepository';
import { ERROR_TOKENS } from 'src/core/errors/dependecy-tokens/application-core-erros.tokens';
import { APPLICATION_CORE_TOKENS } from 'src/core/application/dependecy-tokens/application-core.tokens';
import { IDatabaseErrorContext } from 'src/core/errors/interface/context/i-error-database.context';
import type { IErrorMapper } from 'src/core/errors/interface/mapper/i-error-mapper.interface';
import type { IMapper } from 'src/core/application/ports/mapper/i-mapper.interface';

// --- Infra & Entities ---
import { KahootEntity } from '../../entities/kahoot/kahoot.entity.pg';
import { KAHOOT_POSTGRES_BASE } from './constants/kahoot.pg-constants';
import { createDatabaseContext } from 'src/core/errors/helpers/database-error-context.helper';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryPostgres } from '../../decorators/repository-postgres.registry';

@RepositoryPostgres(RepositoryName.Kahoot)
@Injectable()
export class KahootRepository implements IKahootRepository {
  private readonly contextBase = KAHOOT_POSTGRES_BASE;
  private readonly adapterName = KahootRepository.name;
  private readonly portName = 'IKahootRepository';

  constructor(
    @InjectRepository(KahootEntity)
    private readonly repo: Repository<KahootEntity>,
    @Inject(ERROR_TOKENS.MAPPERS.POSTGRES)
    private readonly pgErrorMapper: IErrorMapper<unknown, IDatabaseErrorContext>,
    @Inject(APPLICATION_CORE_TOKENS.MAPPER.KAHOOT_PG_SNAPSHOT) // Mapper específico para aplanar Entity -> Snapshot
    private readonly pgReadMapper: IMapper<KahootEntity, KahootSnapshot>,
    private readonly dataSource: DataSource, // Para transacciones manuales si fuera necesario
  ) {}

  private getCtx(operation: string, entityId?: string) {
    return createDatabaseContext(this.contextBase, this.adapterName, this.portName, operation, entityId);
  }

  // ==========================================
  // MÉTODOS DE DOMINIO
  // ==========================================

  public async saveKahootEither(kahoot: Kahoot): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('save', kahoot.id.value);
    const snapshot = kahoot.getSnapshot();

    const result = await Either.tryCatch(
      // save() en TypeORM hace "upsert" automáticamente si encuentra el ID
      // Gracias al cascade: true en las entidades, esto guarda slides y opciones.
      this.repo.save(this.repo.create(snapshot as any)), 
      (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    return result.map(() => undefined);
  }

  public async findKahootByIdEither(id: string): Promise<Either<ErrorData, Kahoot | null>> {
    const ctx = this.getCtx('findById', id);

    const result = await Either.tryCatch(
      this.repo.findOne({
        where: { id },
        relations: ['slides', 'slides.options'], // Importante: Cargar el árbol completo
      }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    return result.chain((entity) => {
      if (!entity) return Either.makeRight(null);
      const snapshot = this.pgReadMapper.map(entity);
      return KahootFactory.reconstructFromSnapshot(snapshot);
    });
  }

  public async findAllKahootsEither(): Promise<Either<ErrorData, Kahoot[]>> {
    const ctx = this.getCtx('findAll');

    const result = await Either.tryCatch(
      this.repo.find({ relations: ['slides', 'slides.options'] }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );

    return result.chain((entities) => {
      const kahoots: Kahoot[] = [];
      for (const entity of entities) {
        const snapshot = this.pgReadMapper.map(entity);
        const res = KahootFactory.reconstructFromSnapshot(snapshot);
        if (res.isLeft()) return Either.makeLeft(res.getLeft());
        kahoots.push(res.getRight());
      }
      return Either.makeRight(kahoots);
    });
  }

  public async deleteKahootEither(id: string): Promise<Either<ErrorData, void>> {
    const ctx = this.getCtx('delete', id);
    const result = await Either.tryCatch(
      this.repo.delete({ id }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );
    return result.map(() => undefined);
  }

  public async existsKahootEither(id: string): Promise<Either<ErrorData, boolean>> {
    const ctx = this.getCtx('exists', id);
    const result = await Either.tryCatch(
      this.repo.countBy({ id }),
      (err) => this.pgErrorMapper.toErrorData(err, ctx)
    );
    return result.map((count) => count > 0);
  }

  public async findKahootById(id: KahootId): Promise<Optional<Kahoot>> {
    const result = await this.findKahootByIdEither(id.value);
    if (result.isLeft()) throw result.getLeft();
    const kahootOrNull = result.getRight();
    return kahootOrNull !== null ? new Optional(kahootOrNull) : new Optional();
  }
}