import {
  Type,
  DynamicModule,
  Module,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { DAO_OVERRIDE_ENV_MAP } from './catalogs/dao.catalog.enum';
import { REPOSITORY_OVERRIDE_ENV_MAP } from './catalogs/repository.catalog.enum';

type ModuleImport = Type<any> | DynamicModule;

@Module({})
export class DatabaseDriverModule {
  static forRoot(): DynamicModule {
    const globalType = process.env.DB_GLOBAL_TYPE;
    if (!globalType || !['postgres', 'mongo'].includes(globalType)) {
      throw new InternalServerErrorException(
        `⚠️ DB_GLOBAL_TYPE inválido: ${globalType}`,
      );
    }

    const imports: ModuleImport[] = [ConfigModule];
    const exports: ModuleImport[] = [];

    const dbsToLoad = new Set<string>();

    // Siempre cargar el globalType
    dbsToLoad.add(globalType);

    // Revisar overrides y agregarlos
    Object.values({
      ...DAO_OVERRIDE_ENV_MAP,
      ...REPOSITORY_OVERRIDE_ENV_MAP,
    }).forEach((envVar) => {
      const override = process.env[envVar];
      if (override && ['postgres', 'mongo'].includes(override)) {
        dbsToLoad.add(override);
      }
    });

    // dbsToLoad siempre tiene al menos el globalType

    if (dbsToLoad.has('postgres')) {
      imports.push(
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            host: config.get<string>('DB_HOST'),
            port: config.get<number>('DB_PORT') ?? 5432,
            database: config.get<string>('DB_NAME'),
            username: config.get<string>('DB_USERNAME'),
            password: config.get<string>('DB_PASSWORD'),
            autoLoadEntities: true,
            synchronize: config.get<boolean>('IS_PROD') ?? false,
          }),
        }),
      );
      exports.push(TypeOrmModule);
      console.log('✅ Base de datos configurada: PostgreSQL (TypeORM)');
    }

    if (dbsToLoad.has('mongo')) {
      if (process.env.MONGO_CNN) {
        imports.push(
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const dbName = config.get<string>('DB_NAME');
              const uri = config.get<string>('MONGO_CNN');
              return { uri, dbName };
            },
          }),
        );
      } else {
        imports.push(
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
              const user = config.get<string>('MONGO_USER');
              const pass = config.get<string>('MONGO_PASSWORD');
              const host = config.get<string>('MONGO_HOST');
              const port = config.get<string>('MONGO_PORT');
              const dbName = config.get<string>('DB_NAME');
              const uri = `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;
              return { uri, dbName };
            },
          }),
        );
      }
      exports.push(MongooseModule);
      console.log('✅ Base de datos configurada: MongoDB (Mongoose)');
    }

    return {
      module: DatabaseDriverModule,
      imports,
      exports,
      global: true,
    };
  }
}
