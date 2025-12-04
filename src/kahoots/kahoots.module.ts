import { Module } from '@nestjs/common';
import { KahootController } from './infrastructure/nest-js/kahoots.controller';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CreateKahootHandler } from './application/commands/create-kahoot/create-kahoothandler';
import {  KahootNestMapperAdapter } from 'src/kahoots/infrastructure/adapters/commands/input/kahoot.request.mapper'; 
import { UuidGenerator } from 'src/core/infrastructure/event-buses/idgenerator/uuid-generator';
import { MapperName } from './application/catalogs/catalog.mapper.enum';
import { KahootResponseMapper } from './infrastructure/adapters/commands/output/kahoot.response.mapper';
import { UpdateKahootHandler } from './application/commands/update-kahoot/update-kahoothandler';
import { DeleteKahootHandler } from './application/commands/delete-kahoot/delete-kahoothandler';
import { GetKahootByIdHandler } from './application/queries/get-kahoot-by-id/get-kahoot-by-id.handler';

@Module({
  controllers: [KahootController],
  imports: [
    RepositoryFactoryModule.forFeature(RepositoryName.Kahoot),
    RepositoryFactoryModule.forFeature(RepositoryName.Attempt),
    DaoFactoryModule.forFeature(DaoName.Kahoot),
    CqrsModule,
  ],
  providers: [
    CreateKahootHandler,
    UpdateKahootHandler,
    DeleteKahootHandler,
    KahootNestMapperAdapter,
    GetKahootByIdHandler,
    UuidGenerator,
    {
        provide: MapperName.KahootResponse, 
        useClass: KahootResponseMapper, 
    },
  ],
})
export class KahootsModule {}
