import { Module } from '@nestjs/common';
import { LibraryController } from './infrastructure/nestjs/library.controller';
import { DaoFactoryModule } from 'src/database/infrastructure/factories/data-access-object.factory.module';
import { DaoName } from 'src/database/infrastructure/catalogs/dao.catalogue.enum';
import { GetDraftsAndCreatedKahootsHandler } from './application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.handler';
import { GetFavoritesHandler } from './application/queries/get-favorite-kahoots/get-favorites.handler';
import { CheckIfCanBeSavedToFavoritesHandler } from './application/queries/check-if-can-be-saved-to-favorites/check-if-can-be-saved-to-favorites.handler';
import { GetCompletedKahootsHandler } from './application/queries/get-completed-kahoots/get-completed-hakoots.handler';
import { GetInProgressKahootsHandler } from './application/queries/get-in-progress-kahoots/get-in-progress-kahoots.handler';
import { RepositoryFactoryModule } from 'src/database/infrastructure/factories/repository.factory.module';
import { RepositoryName } from 'src/database/infrastructure/catalogs/repository.catalog.enum';
/*import { GetDraftsAndCreatedKahootsQuery } from './application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';*/
import { AddKahootToFavoritesHandler } from './application/commands/add-kahoot-to-favorites/add-kahoot-to-favorites.handler';
import { RemoveKahootFromFavoritesHandler } from './application/commands/remove-kahoot-from-favorites/remove-kahoot-from-favorites.handler';

@Module({
  controllers: [LibraryController],
  imports: [
    DaoFactoryModule.forFeature(DaoName.Library),
    RepositoryFactoryModule.forFeature(RepositoryName.User),
  ],
  providers: [
    GetDraftsAndCreatedKahootsHandler,
    GetFavoritesHandler,
    CheckIfCanBeSavedToFavoritesHandler,
    AddKahootToFavoritesHandler,
    RemoveKahootFromFavoritesHandler,
    GetInProgressKahootsHandler,
    GetCompletedKahootsHandler,
  ],
})
export class LibraryModule {}
