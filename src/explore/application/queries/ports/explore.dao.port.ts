// ikahoot.dao.ts
import { Optional } from 'src/core/types/optional';
import { KahootListReadModel } from '../../read-models/kahoot-list.read-model';
import { PaginatedKahootListReadModel } from '../../read-models/kahoot-list.read-model';
import { CategoryReadModel } from '../../read-models/category.read-model';

export interface GetPublicKahootsQueryParams {
  searchTerm?: string;
  categories?: string[];
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'title' | 'playCount';
  order?: 'asc' | 'desc';
}

export interface IExploreDao {
  // For GET /explore - paginated public kahoots with filtering
  getPublicKahoots(
    query: GetPublicKahootsQueryParams
  ): Promise<PaginatedKahootListReadModel>;

  // For GET /explore/featured - featured kahoots with algorithm-based ranking
  getFeaturedKahoots(limit: number): Promise<KahootListReadModel[]>;

  // For GET /explore/categories - static category list
  getAvailableCategories(): Promise<CategoryReadModel[]>;

  // Optional helper method if you need to fetch author details separately
  getAuthorName(authorId: string): Promise<Optional<string>>;
}