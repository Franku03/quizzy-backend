import { Module, OnModuleInit } from '@nestjs/common';
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
import { CommandBus } from 'src/core/infrastructure/cqrs/command-bus';
import { QueryBus } from 'src/core/infrastructure/cqrs/query-bus';
import { GetDraftsAndCreatedKahootsQuery } from './application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { AddKahootToFavoritesHandler } from './application/commands/add-kahoot-to-favorites/add-kahoot-to-favorites.handler';
import { RemoveKahootFromFavoritesHandler } from './application/commands/remove-kahoot-from-favorites/remove-kahoot-from-favorites.handler';
import { CheckIfCanBeSavedToFavoritesQuery } from './application/queries/check-if-can-be-saved-to-favorites/check-if-can-be-saved-to-favorites.query';
import { GetFavoritesQuery } from './application/queries/get-favorite-kahoots/get-favorites.query';
import { GetInProgressKahootsQuery } from './application/queries/get-in-progress-kahoots/get-in-progress-kahoots.query';
import { GetCompletedKahootsQuery } from './application/queries/get-completed-kahoots/get-completed-kahoots.query';
import { AddKahootToFavoritesCommand } from './application/commands/add-kahoot-to-favorites/add-kahoot-to-favorites.command';
import { RemoveKahootFromFavoritesCommand } from './application/commands/remove-kahoot-from-favorites/remove-kahoot-from-favorites.command';

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
export class LibraryModule implements OnModuleInit {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly getDraftsAndCreatedKahootsHandler: GetDraftsAndCreatedKahootsHandler,
    private readonly getFavoritesHandler: GetFavoritesHandler,
    private readonly checkIfCanBeSavedToFavoritesHandler: CheckIfCanBeSavedToFavoritesHandler,
    private readonly addKahootToFavoritesHandler: AddKahootToFavoritesHandler,
    private readonly removeKahootFromFavoritesHandler: RemoveKahootFromFavoritesHandler,
    private readonly getInProgressKahootsHandler: GetInProgressKahootsHandler,
    private readonly getCompletedKahootsHandler: GetCompletedKahootsHandler,
  ) {}

  onModuleInit() {
    // Mapeo de Query Handlers
    this.queryBus.register(
      GetDraftsAndCreatedKahootsQuery,
      this.getDraftsAndCreatedKahootsHandler,
    );
    this.queryBus.register(GetFavoritesQuery, this.getFavoritesHandler);
    this.queryBus.register(
      CheckIfCanBeSavedToFavoritesQuery,
      this.checkIfCanBeSavedToFavoritesHandler,
    );
    this.queryBus.register(
      GetInProgressKahootsQuery,
      this.getInProgressKahootsHandler,
    );
    this.queryBus.register(
      GetCompletedKahootsQuery,
      this.getCompletedKahootsHandler,
    );

    // Mapeo de Command Handlers
    this.commandBus.register(
      AddKahootToFavoritesCommand,
      this.addKahootToFavoritesHandler,
    );
    this.commandBus.register(
      RemoveKahootFromFavoritesCommand,
      this.removeKahootFromFavoritesHandler,
    );
  }
}
