import { Module } from '@nestjs/common';
import { ExploreController } from './infrastructure/nestjs/explore.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';

// Handlers
import { GetPublicKahootsHandler } from './application/queries/get-public-kahoots/get.public.kahoots.handler';
import { GetFeaturedKahootsHandler } from './application/queries/get-featured-kahoots/get-featured-kahoots.handler';
import { GetCategoriesHandler } from './application/queries/get-categories/get-categories.handler';

@Module({
  controllers: [ExploreController],
  imports: [
    DaoFactoryModule.forFeature(DaoName.Explore), // Carga de un DAO (para queries de CQRS)
    CqrsModule,
  ],
  providers: [
    // handlers
    GetPublicKahootsHandler,
    GetFeaturedKahootsHandler,
    GetCategoriesHandler,
  ],
})
export class ExploreModule {}