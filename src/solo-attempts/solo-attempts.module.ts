import { Module } from '@nestjs/common';
import { SoloAttemptsController } from './infrastructure/nest-js/solo-attempts.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// Handlers
import { StartSoloAttemptHandler } from './application/commands/start-attempt/start-attempt.handler';
import { CreateUserHandler } from 'src/users/application/commands/create-user/create-user.handler';
import { SubmitAnswerHandler } from './application/commands/submit-answer/submit-answer.handler';

@Module({
  controllers: [SoloAttemptsController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt), // carga de repositorio (para commands de CQRS)
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    ///DaoFactoryModule.forFeature(DaoName.Attempt), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    StartSoloAttemptHandler, //commandHandler
    SubmitAnswerHandler
  ],
})
export class SoloAttemptsModule {}