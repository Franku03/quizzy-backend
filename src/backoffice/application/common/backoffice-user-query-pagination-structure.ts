export interface BackofficeUserQueryPaginationStructure {
  name?: string;
  userId?: string;
  limit?: number;
  page?: number;
  orderBy?: 'createdAt' | 'name' | 'usertype';
  order?: 'asc' | 'desc';
}
