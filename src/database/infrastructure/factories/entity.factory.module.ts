import { Module, DynamicModule, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MONGOOSE_ENTITY_REGISTRY,
  TYPEORM_ENTITY_REGISTRY,
} from '../catalogs/entity.catalog.enum';


type ModuleImport = Type<any> | DynamicModule;

@Module({})
export class EntityFactoryModule {
  static forRoot(): DynamicModule {
    const dbType = process.env.DB_TYPE;
    if (!dbType || !['postgres', 'mongo'].includes(dbType)) {
      throw new Error(`DB_TYPE inválido: ${dbType}`);
    }

    const conditionalImports: ModuleImport[] = [];
    const exports: ModuleImport[] = [];

    try {
      if (dbType === 'postgres') {
        // Tomamos todas las entidades TypeORM del catálogo
        conditionalImports.push(
          TypeOrmModule.forFeature(TYPEORM_ENTITY_REGISTRY),
        );
        exports.push(TypeOrmModule);
      } else if (dbType === 'mongo') {
        // Tomamos todos los esquemas Mongoose del catálogo
        conditionalImports.push(
          MongooseModule.forFeature(MONGOOSE_ENTITY_REGISTRY),
        );
        exports.push(MongooseModule);
      }
    } catch (err) {
      console.error(err);
      console.error(`Current DB_TYPE value: ${dbType}`);
      this.handleMissingEntityError();
    }

    return {
      module: EntityFactoryModule,
      imports: [...conditionalImports],
      exports: exports,
    };
  }

  private static handleMissingEntityError() {
    throw new Error(
      `⚠️ Se intentó cargar una entidad que no fue declarada en el catálogo de entities. Revisar TYPEORM_ENTITY_REGISTRY o MONGOOSE_ENTITY_REGISTRY`,
    );
  }
}
