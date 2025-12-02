import { Module, DynamicModule, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelDefinition, MongooseModule } from '@nestjs/mongoose';
import {
  EntityName,
  TYPEORM_ENTITY_REGISTRY,
  MONGOOSE_ENTITY_REGISTRY,
} from './entities/entity.catalog.enum';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

type ModuleImport = Type<any> | DynamicModule;

@Module({})
export class EntityFactoryModule {
  static forFeature(entity: EntityName): DynamicModule {
    const dbType = process.env.DB_TYPE;
    if (!dbType || !['postgres', 'mongo'].includes(dbType)) {
      throw new Error(`DB_TYPE inválido: ${dbType}`);
    }

    const conditionalImports: ModuleImport[] = [];
    const exports: ModuleImport[] = [];

    try {
      if (dbType === 'postgres') {
        const entityData = TYPEORM_ENTITY_REGISTRY[entity];
        if (!entityData) this.handleMissingEntityError();

        // Carga TypeORM forFeature
        conditionalImports.push(
          TypeOrmModule.forFeature([entityData as EntityClassOrSchema]),
        );
        // Exporta TypeOrmModule para hacer visible el Repository
        exports.push(TypeOrmModule);
      } else if (dbType === 'mongo') {
        const schemaData = MONGOOSE_ENTITY_REGISTRY[entity];
        if (!schemaData) this.handleMissingEntityError();

        // Carga Mongoose forFeature
        conditionalImports.push(
          MongooseModule.forFeature([schemaData as ModelDefinition]),
        );
        // Exporta MongooseModule para hacer visible el Model
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
        const allEntities = Object.values(TYPEORM_ENTITY_REGISTRY);
        conditionalImports.push(
          TypeOrmModule.forFeature(allEntities as EntityClassOrSchema[]),
        );
        exports.push(TypeOrmModule);
      } else if (dbType === 'mongo') {
        // Tomamos todos los esquemas Mongoose del catálogo
        const allSchemas = Object.values(MONGOOSE_ENTITY_REGISTRY);
        conditionalImports.push(
          MongooseModule.forFeature(allSchemas as ModelDefinition[]),
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
