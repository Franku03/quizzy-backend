import { Either } from 'src/core/types/either';
import { Optional } from '../../../../core/types/optional';
import { GetDraftsAndCreatedKahootsQuery } from '../get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { LibraryReadModel } from '../read-model/library.read.model';
import { GetFavoritesQuery } from '../get-favorite-kahoots/get-favorites.query';
import { GetCompletedKahootsQuery } from '../get-completed-kahoots/get-completed-kahoots.query';
import { GetInProgressKahootsQuery } from '../get-in-progress-kahoots/get-in-progress-kahoots.query';

export interface ILibraryDao {
  getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>>;
  GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<Error, LibraryReadModel>>;
  checkIfCanBeAddedToFavorites(kahootId: string): Promise<Optional<Error>>;
  getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>>;
  getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>>;
}
