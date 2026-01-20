/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\library\application\queries\get-favorite-kahoots\get-favorites.query.ts

import { IQuery } from 'src/core/application/cqrs/query.interface';
import { QueryPaginationStructure } from '../common/query-pagination-structure';

export class GetFavoritesQuery implements QueryPaginationStructure, IQuery {
  constructor(
    public readonly userId: string,
    public readonly limit: number,
    public readonly page: number,
    public readonly status: 'draft' | 'published' | 'all',
    public readonly visibility: 'public' | 'private' | 'all',
    public readonly orderBy: 'createdAt' | 'title' | 'likesCount',
    public readonly order: 'asc' | 'desc',
    public readonly categories: string[],
    public readonly q?: string,
  ) {}
}
