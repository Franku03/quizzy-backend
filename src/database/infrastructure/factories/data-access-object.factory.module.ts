import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntityFactoryModule } from './entity.factory.module';
import { DaoMongoRegistry } from '../mongo/registries/dao-mongo.registry';
import { DaoPostgresRegistry } from '../postgres/registries/dao-postgres.registry';
import { DAO_OVERRIDE_ENV_MAP, DaoName } from '../catalogs/dao.catalog.enum';
import { DaoConstructor } from '../class-constructors/dao.constructor';
import { MediaModule } from 'src/media/infrastructure/nest-js/media.module';

@Module({
  imports: [
      MediaModule
    ],
})
export class DaoFactoryModule {
  static forFeature(daoKey: DaoName): DynamicModule {
    const globalType = process.env.DB_GLOBAL_TYPE;
    if (!globalType || !['postgres', 'mongo'].includes(globalType)) {
      throw new Error(`DB_GLOBAL_TYPE inválido: ${globalType}`);
    }

    const overrideEnv = DAO_OVERRIDE_ENV_MAP[daoKey];
    const overrideType = process.env[overrideEnv] ?? globalType;

    let DaoClass: DaoConstructor | undefined;
    if (overrideType === 'postgres') {
      DaoClass = DaoPostgresRegistry.get(daoKey);
    } else {
      DaoClass = DaoMongoRegistry.get(daoKey);
    }

    if (!DaoClass) this.handleMissingDaoError(overrideType, daoKey);

    return {
      module: DaoFactoryModule,
      imports: [ConfigModule, EntityFactoryModule.forFeature(overrideType)],
      providers: [
        {
          provide: daoKey,
          useClass: DaoClass!,
        },
      ],
      exports: [daoKey],
    };
  }

  private static handleMissingDaoError(dbType: string, daoKey: string) {
    throw new Error(
      `⚠️ No se encontró implementación de ${dbType} para el DAO ${daoKey}. Verifica los registries.`,
    );
  }
}
