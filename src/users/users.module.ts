import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { UsersController } from './infrastructure/nest-js/users.controller';

import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { GetUserByNameHandler } from './application/queries/get-user-by-name/get-user-by-name.handler';

import { UuidGeneratorService } from './infrastructure/external-services/uuid-generator.service';
import { BcryptHasherService } from './infrastructure/external-services/bcrypt-hasher.service';

@Module({
  controllers: [UsersController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.User), 
    DaoFactoryModule.forFeature(DaoName.User), 
    CqrsModule,
  ],
  providers: [
    CreateUserHandler,

    {
      provide: 'IUuidGenerationService',
      useClass: UuidGeneratorService,
    },
    {
      provide: 'IPasswordHasher',
      useClass: BcryptHasherService,
    },
  ],
})
export class UsersModule {}