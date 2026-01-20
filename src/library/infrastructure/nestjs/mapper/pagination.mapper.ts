/**
 * MIT License | Copyright (c) 2025
 * Authors: G. Kufatty, L. Monroy, L. Ochoa, F. Quintana, Sergio Rodriguez, Santiago Silva
 * Project: quizzy-backend
 *
 * Full license text available in the LICENSE file at the root of this project.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
 */

// File: src\library\infrastructure\nestjs\mapper\pagination.mapper.ts

import { QueryPaginationStructure } from 'src/library/application/queries/common/query-pagination-structure';
import { PaginationDto } from '../dtos/pagination.dto';

export class PaginationMapper {
  static toQuery<T extends QueryPaginationStructure>(
    dto: PaginationDto,
    userId: string,
    QueryType: new (
      userId: string,
      limit: number,
      page: number,
      status: 'draft' | 'published' | 'all',
      visibility: 'public' | 'private' | 'all',
      orderBy: 'createdAt' | 'title' | 'likesCount',
      order: 'asc' | 'desc',
      categories: string[],
      q?: string,
    ) => T,
  ): T {
    return new QueryType(
      userId,
      dto.limit,
      dto.page,
      dto.status,
      dto.visibility,
      dto.orderBy,
      dto.order,
      dto.categories,
      dto.q,
    );
  }
}
