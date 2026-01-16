/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\library\application\queries\check-if-can-be-saved-to-favorites\check-if-can-be-saved-to-favorites.query.ts

import { IQuery } from 'src/core/application/cqrs/query.interface';

export class CheckIfCanBeSavedToFavoritesQuery implements IQuery {
  constructor(public readonly kahootId: string) {}
}
