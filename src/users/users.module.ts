import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/nest-js/users.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetUserByNameHandler } from './application/queries/get-user-by-name/get-user-by-name.handler';

@Module({
  controllers: [UsersController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.User), // carga de repositorio (para commands de CQRS)
    DaoFactoryModule.forFeature(DaoName.User), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    CreateUserHandler, //commandHandler
    GetUserByNameHandler, //queryHandler
  ],
})
export class UsersModule {}
