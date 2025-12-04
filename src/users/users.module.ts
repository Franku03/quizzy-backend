import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// 1. Controladores
import { UsersController } from './infrastructure/nest-js/users.controller';

// 2. Infraestructura de Datos (Factories de LM)
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// 3. Handlers (Lógica)
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { GetUserByNameHandler } from './application/queries/get-user-by-name/get-user-by-name.handler';

// 4. Servicios Externos e Interfaces (¡LO QUE FALTABA!) 👇
import { UuidGeneratorService } from './infrastructure/external-services/uuid-generator.service';
import { BcryptHasherService } from './infrastructure/external-services/bcrypt-hasher.service';
import { IUuidGenerationService } from './domain/domain-services/i.uuid-generator.interface';
import { IPasswordHasher } from './domain/domain-services/i.password-hasher.interface';

@Module({
  controllers: [UsersController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.User), 
    DaoFactoryModule.forFeature(DaoName.User), 
    CqrsModule,
  ],
  providers: [
    // Handlers
    CreateUserHandler, 
    GetUserByNameHandler,

    // 👇 AQUÍ REGISTRAMOS TUS SERVICIOS NUEVOS
    {
      provide: 'IUuidGenerationService', // Cuando pidan la Interfaz...
      useClass: UuidGeneratorService,  // ...dales la implementación de Crypto
    },
    {
      provide: 'IPasswordHasher',        // Cuando pidan la Interfaz...
      useClass: BcryptHasherService,   // ...dales la implementación de Bcrypt
    },
  ],
})
export class UsersModule {}