import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntityFactoryModule } from './entity.factory.module';
import {
  REPOSITORY_OVERRIDE_ENV_MAP,
  RepositoryName,
} from '../catalogs/repository.catalog.enum';
import { RepositoryConstructor } from '../class-constructors/repository.constructor';
import { RepositoryPostgresRegistry } from '../postgres/registries/repository-postgres.registry';
import { RepositoryMongoRegistry } from '../mongo/registries/repository-mongo.registry';

@Module({})
export class RepositoryFactoryModule {
  static forFeature(repoKey: RepositoryName): DynamicModule {
    const globalType = process.env.DB_GLOBAL_TYPE;
    if (!globalType || !['postgres', 'mongo'].includes(globalType)) {
      throw new Error(`DB_GLOBAL_TYPE inválido: ${globalType}`);
    }

    const overrideEnv = REPOSITORY_OVERRIDE_ENV_MAP[repoKey];
    const overrideType = process.env[overrideEnv] ?? globalType;

    let RepoClass: RepositoryConstructor | undefined;
    if (overrideType === 'postgres') {
      RepoClass = RepositoryPostgresRegistry.get(repoKey);
    } else {
      RepoClass = RepositoryMongoRegistry.get(repoKey);
    }

    if (!RepoClass) this.handleMissingRepositoryError(overrideType, repoKey);

    return {
      module: RepositoryFactoryModule,
      imports: [ConfigModule, EntityFactoryModule.forFeature(overrideType)],
      providers: [
        {
          provide: repoKey,
          useClass: RepoClass!,
        },
      ],
      exports: [repoKey],
    };
  }

  private static handleMissingRepositoryError(dbType: string, repoKey: string) {
    throw new Error(
      `⚠️ No se encontró implementación de ${dbType} para el Repository ${repoKey}. Verifica los registries.`,
    );
  }
}
