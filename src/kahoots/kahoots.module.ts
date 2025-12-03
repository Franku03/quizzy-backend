import { Module } from '@nestjs/common';
import { KahootController } from './infrastructure/nest-js/kahoots.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateKahootHandler } from './application/commands/create-kahoot.command/create-kahoothandler';

@Module({
  controllers: [KahootController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    DaoFactoryModule.forFeature(DaoName.User),
    CqrsModule,
  ],
  providers: [
    CreateKahootHandler
  ],
})
export class KahootsModule {}
