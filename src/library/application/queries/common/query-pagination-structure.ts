export interface QueryPaginationStructure {
  userId: string;
  limit: number;
  page: number;
  status: 'draft' | 'published' | 'all';
  visibility: 'public' | 'private' | 'all';
  orderBy: 'createdAt' | 'title' | 'likesCount';
  order: 'asc' | 'desc';
  categories: string[];
  q?: string;
}
