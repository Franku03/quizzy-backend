import { QueryPaginationStructure } from '../common/query-pagination-structure';

export class GetInProgressKahootsQuery implements QueryPaginationStructure {
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
