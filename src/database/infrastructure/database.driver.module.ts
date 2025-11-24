import {
  Type,
  DynamicModule,
  Module,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';

type ModuleImport = Type<any> | DynamicModule;

@Module({})
export class DatabaseDriverModule {
  static forRoot(): DynamicModule {
    const dbType = process.env.DB_TYPE;

    const imports: ModuleImport[] = [ConfigModule];
    const exports: ModuleImport[] = [];

    // Lógica condicional para TypeOrm
    if (dbType === 'postgres') {
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
      // Exportamos el módulo base para que otros módulos puedan usar TypeOrm (e.g., inyectar Repositorios)
      exports.push(TypeOrmModule);
      console.log('✅ Base de datos configurada: PostgreSQL (TypeORM)');

      // Lógica condicional para Mongoose
    } else if (dbType === 'mongo') {
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

            // Construcción de la URI
            const uri = `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;

            return { uri, dbName };
          },
        }),
      );
      // Exportamos el módulo base para que otros módulos puedan usar Mongoose (e.g., inyectar Modelos)
      exports.push(MongooseModule);
      console.log('✅ Base de datos configurada: MongoDB (Mongoose)');
    } else {
      console.warn(
        '⚠️ DB_TYPE no está definido o es inválido. No se ha cargado ningún driver de base de datos.',
      );
      throw new InternalServerErrorException(
        '⚠️ DB_TYPE no está definido o es inválido. No se ha cargado ningún driver de base de datos.',
      );
    }

    // Retornamos el módulo dinámico
    return {
      module: DatabaseDriverModule,
      imports: imports,
      exports: exports,
      global: true,
    };
  }
}
