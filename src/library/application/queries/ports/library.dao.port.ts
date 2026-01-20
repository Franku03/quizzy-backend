/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\library\application\queries\ports\library.dao.port.ts

import { Either } from 'src/core/types/either';
import { Optional } from '../../../../core/types/optional';
import { GetDraftsAndCreatedKahootsQuery } from '../get-drafts-and-created-kahoots/get-drafts-and-created-kahoots.query';
import { LibraryReadModel } from '../read-model/library.read.model';
import { GetFavoritesQuery } from '../get-favorite-kahoots/get-favorites.query';
import { GetCompletedKahootsQuery } from '../get-completed-kahoots/get-completed-kahoots.query';
import { GetInProgressKahootsQuery } from '../get-in-progress-kahoots/get-in-progress-kahoots.query';
import { ErrorData } from 'src/core/types';

export interface ILibraryDao {
  getDraftsAndCreatedKahootsFrom(
    query: GetDraftsAndCreatedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>>;
  GetFavorites(
    query: GetFavoritesQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>>;
  checkIfCanBeAddedToFavorites(kahootId: string): Promise<Optional<ErrorData>>;
  getCompletedKahoots(
    query: GetCompletedKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>>;
  getInProgressKahoots(
    query: GetInProgressKahootsQuery,
  ): Promise<Either<ErrorData, LibraryReadModel>>;
}
