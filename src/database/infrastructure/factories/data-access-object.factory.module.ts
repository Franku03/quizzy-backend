import { DynamicModule, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EntityFactoryModule } from './entity.factory.module';
import { DAO_REGISTRY, DaoName } from '../catalogs/dao.catalogue.enum';
import { CqrsModule } from '@nestjs/cqrs';

@Module({})
export class DaoFactoryModule {
  static forFeature(daoName: DaoName): DynamicModule {
    const dbType = process.env.DB_TYPE;

    if (!dbType || !['postgres', 'mongo'].includes(dbType)) {
      throw new Error(`DB_TYPE inválido: ${dbType}`);
    }

    const registryItem = DAO_REGISTRY[daoName];
    const RepoClass: Type<any> | null =
      dbType === 'postgres' ? registryItem.typeorm : registryItem.mongoose;

    if (!RepoClass) this.handleMissingRepositoryError(dbType);

    if (!RepoClass) {
      throw new Error(`No hay implementación de ${dbType} para ${daoName}`);
    }

    return {
      module: DaoFactoryModule,
      imports: [ConfigModule, EntityFactoryModule.forRoot(), CqrsModule], // Se carga todo el modelo para resolver las dependencias de cualqueir dao
      providers: [
        {
          provide: daoName,
          useClass: RepoClass, // Nest crea la instancia y resuelve dependencias
        },
      ],
      exports: [daoName],
    };
  }

  private static handleMissingRepositoryError(DbType: string) {
    throw new Error(
      `⚠️ Se intentó cargar una entidad de ${DbType} que no fue declarada en el catalogo de entities. Revisar ENTITY_REGISTRY`,
    );
  }
}
