import { Module, DynamicModule, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule, ModelDefinition } from '@nestjs/mongoose';
import { DbModelMongoRegistry } from '../mongo/registries/db-model-mongo.registry';
import { DbModelPostgresRegistry } from '../postgres/registries/db-model-postgres.registry';

type ModuleImport = Type<any> | DynamicModule;

@Module({})
export class EntityFactoryModule {
  static forRoot(): DynamicModule {
    const conditionalImports: ModuleImport[] = [];
    const exports: ModuleImport[] = [];

    try {
      const mongoEntities = DbModelMongoRegistry.getRegistrations();
      const postgresEntities = DbModelPostgresRegistry.getRegistrations();

      if (mongoEntities.length > 0) {
        const definitions: ModelDefinition[] = mongoEntities.map((e) => {
          if (!e.model || !e.schema) {
            throw new Error(
              `⚠️ Registro Mongo incompleto para clave ${e.key}. Falta model o schema.`,
            );
          }
          return {
            name: e.model.name,
            schema: e.schema,
          };
        });

        conditionalImports.push(MongooseModule.forFeature(definitions));
        exports.push(MongooseModule);
      }

      if (postgresEntities.length > 0) {
        conditionalImports.push(
          TypeOrmModule.forFeature(postgresEntities.map((e) => e.entity!)),
        );
        exports.push(TypeOrmModule);
      }
    } catch (err) {
      console.error(err);
      this.handleMissingEntityError();
    }

    return {
      module: EntityFactoryModule,
      imports: [...conditionalImports],
      exports,
    };
  }

  // Carga entidades solo del driver indicado
  static forFeature(driver: string): DynamicModule {
    const conditionalImports: ModuleImport[] = [];
    const exports: ModuleImport[] = [];

    if (driver !== 'mongo' && driver !== 'postgres') {
      throw new Error(`⚠️ Driver de base de datos desconocido: ${driver}`);
    }

    try {
      if (driver === 'mongo') {
        const mongoEntities = DbModelMongoRegistry.getRegistrations();
        if (mongoEntities.length > 0) {
          const definitions: ModelDefinition[] = mongoEntities.map((e) => {
            if (!e.model || !e.schema) {
              throw new Error(
                `⚠️ Registro Mongo incompleto para clave ${e.key}. Falta model o schema.`,
              );
            }
            return {
              name: e.model.name,
              schema: e.schema,
            };
          });

          conditionalImports.push(MongooseModule.forFeature(definitions));
          exports.push(MongooseModule);
        }
      }

      if (driver === 'postgres') {
        const postgresEntities = DbModelPostgresRegistry.getRegistrations();
        if (postgresEntities.length > 0) {
          conditionalImports.push(
            TypeOrmModule.forFeature(postgresEntities.map((e) => e.entity!)),
          );
          exports.push(TypeOrmModule);
        }
      }
    } catch (err) {
      console.error(err);
      this.handleMissingEntityError();
    }

    return {
      module: EntityFactoryModule,
      imports: [...conditionalImports],
      exports,
    };
  }

  private static handleMissingEntityError() {
    throw new Error(
      `⚠️ Se intentó cargar una entidad que no fue declarada en los registries.`,
    );
  }
}
