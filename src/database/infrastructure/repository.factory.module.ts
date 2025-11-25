import { DynamicModule, Module, Type } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  REPOSITORY_REGISTRY,
  RepositoryName,
} from './repositories/repository.catalog.enum';
import { EntityFactoryModule } from './entity.factory.module';

@Module({})
export class RepositoryFactoryModule {
  static forFeature(repositoryName: RepositoryName): DynamicModule {
    const dbType = process.env.DB_TYPE;

    if (!dbType || !['postgres', 'mongo'].includes(dbType)) {
      throw new Error(`DB_TYPE inválido: ${dbType}`);
    }

    const registryItem = REPOSITORY_REGISTRY[repositoryName];
    const RepoClass: Type<any> | null =
      dbType === 'postgres' ? registryItem.typeorm : registryItem.mongoose;

    if (!RepoClass) this.handleMissingRepositoryError(dbType);

    if (!RepoClass) {
      throw new Error(
        `No hay implementación de ${dbType} para ${repositoryName}`,
      );
    }

    return {
      module: RepositoryFactoryModule,
      imports: [ConfigModule, EntityFactoryModule.forRoot()], // Se carga todo el modelo para resolver las dependencias de cualqueir repo
      providers: [
        {
          provide: repositoryName,
          useClass: RepoClass, // Nest crea la instancia y resuelve dependencias
        },
      ],
      exports: [repositoryName],
    };
  }

  private static handleMissingRepositoryError(DbType: string) {
    throw new Error(
      `⚠️ Se intentó cargar una entidad de ${DbType} que no fue declarada en el catalogo de entities. Revisar ENTITY_REGISTRY`,
    );
  }
}
