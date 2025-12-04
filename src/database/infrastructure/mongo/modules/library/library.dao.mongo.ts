import { Injectable } from '@nestjs/common';
import { Either } from 'src/core/types/either';
import { Optional } from 'src/core/types/optional';
import { GetCompletedKahootsQuery } from 'src/library/application/queries/get-completed-kahoots/get-completed-kahoots.query';
import { GetDraftsAndCreatedKahootsQuery } from 'src/library/application/queries/get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { GetFavoritesQuery } from 'src/library/application/queries/get-favorite-kahoots/get-favorites.query';
import { ILibraryDao } from 'src/library/application/queries/ports/library.dao.port';
import { GetInProgressKahootsQuery } from '../../../../../library/application/queries/get-in-progress-kahoots/get-in-progress-kahoots.query';
import {
  KahootReadModel,
  LibraryReadModel,
  PaginationInfo,
} from 'src/library/application/queries/read-model/library.read.model';

@Injectable()
export class LibraryDaoMongo implements ILibraryDao {
  constructor() {}
  async getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    const mockKahoot = new KahootReadModel(
      'mock-id',
      'Mock Kahoot Title',
      'This is a mock description',
      null,
      'public',
      'mock-theme-id',
      { id: 'author-id', name: 'Mock Author' },
      new Date().toISOString(),
      42,
      'Matematica',
      'draft',
    );

    const mockPagination = new PaginationInfo(1, 10, 1, 1);

    const mockLibrary = new LibraryReadModel([mockKahoot], mockPagination);

    return Promise.resolve(
      Either.makeRight<Error, LibraryReadModel>(mockLibrary),
    );
  }

  async GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    const mockKahoot = new KahootReadModel(
      'mock-id',
      'Mock Kahoot Title',
      'This is a mock description',
      null,
      'public',
      'mock-theme-id',
      { id: 'author-id', name: 'Mock Author' },
      new Date().toISOString(),
      42,
      'Matematica',
      'draft',
    );

    const mockPagination = new PaginationInfo(1, 10, 1, 1);

    const mockLibrary = new LibraryReadModel([mockKahoot], mockPagination);

    return Promise.resolve(
      Either.makeRight<Error, LibraryReadModel>(mockLibrary),
    );
  }

  async checkIfCanBeAddedToFavorites(
    kahootId: string,
  ): Promise<Optional<Error>> {
    return Promise.resolve(new Optional());
  }

  //addfavorites
  //removefavorites

  async getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    const mockKahoot = new KahootReadModel(
      'mock-id',
      'Mock Kahoot Title',
      'This is a mock description',
      null,
      'public',
      'mock-theme-id',
      { id: 'author-id', name: 'Mock Author' },
      new Date().toISOString(),
      42,
      'Matematica',
      'draft',
    );

    const mockPagination = new PaginationInfo(1, 10, 1, 1);

    const mockLibrary = new LibraryReadModel([mockKahoot], mockPagination);

    return Promise.resolve(
      Either.makeRight<Error, LibraryReadModel>(mockLibrary),
    );
  }

  async getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<Error, LibraryReadModel>> {
    const mockKahoot = new KahootReadModel(
      'mock-id',
      'Mock Kahoot Title',
      'This is a mock description',
      null,
      'public',
      'mock-theme-id',
      { id: 'author-id', name: 'Mock Author' },
      new Date().toISOString(),
      42,
      'Matematica',
      'draft',
    );

    const mockPagination = new PaginationInfo(1, 10, 1, 1);

    const mockLibrary = new LibraryReadModel([mockKahoot], mockPagination);

    return Promise.resolve(
      Either.makeRight<Error, LibraryReadModel>(mockLibrary),
    );
  }
}
